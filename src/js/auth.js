// RestaurantOS - Authentication Module
import { supabaseClient, getState, setState, Icons } from './config.js';
window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("forceLanding", "true");
});
// Check if user is authenticated
export async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session?.user) {
        setState({ user: session.user });
        await fetchProfile(session.user.id);
        return true;
    }
    return false;
}

// Fetch user profile
async function fetchProfile(userId) {
    const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
    console.log("Profile Data:", profile);
    console.log("Profile Error:", error);

    if (!error && profile) {
        setState({ profile });
    }
}

// Sign In
export async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password
    });
    if (error) throw error;

    if (data.user) {
        setState({ user: data.user });
        await fetchProfile(data.user.id);
    }

    return data;
}

// Sign Up
export async function signUp(email, password, fullName) {
    const { data, error } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
            data: {
                full_name: fullName || "User"
            }
        }
    });

    if (error) {
        console.log("Signup error:", error.message);
        throw error;
    }

   if (data.user) {
    await supabaseClient
        .from('profiles')
        .insert([
            {
                id: data.user.id,
                full_name: fullName,
                email: email,
                role: 'staff'
            }
        ]);
}
if (data.user) {
    await supabaseClient
        .from('profiles')
        .insert([
            {
                id: data.user.id,
                full_name: fullName,
                email: email,
                role: 'admin'
            }
        ]);
}
if (data.user) {
    const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
            id: data.user.id,
            full_name: fullName,
            email: email,
            role: 'admin'
        });

    console.log("PROFILE ERROR:", profileError);
}
return data;
}

// Sign Out
export async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    setState({ user: null, profile: null });
   localStorage.removeItem('sb-ykkgnzcusbrklcyvmktm-auth-token');
  window.location.reload();


}

// Listen for auth state changes
export function initAuthListener() {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            setState({ user: session.user });
            await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
            setState({ user: null, profile: null });
        }
    });
}

// Render Login Page
export function renderLoginPage(container) {
    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo">
                    <div class="auth-logo-icon">🍽️</div>
                    <h1>RestaurantOS</h1>
                    <p>Management System</p>
                </div>

                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Sign In</button>
                    <button class="auth-tab" data-tab="signup">Sign Up</button>
                </div>

                <form id="auth-form">
                    <div class="form-group" id="fullname-group" style="display: none;">
                        <label class="form-label">Full Name</label>
                        <div class="form-input-icon">
                            <input type="text" class="form-input" id="fullname" placeholder="John Doe">
                            <span class="icon">${Icons.user}</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <div class="form-input-icon">
                            <input type="email" class="form-input" id="email" placeholder="you@example.com" required>
                            <span class="icon">${Icons.email}</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <div class="form-input-icon">
                            <input type="password" class="form-input" id="password" placeholder="••••••••" required minlength="6">
                            <span class="icon">🔐</span>
                        </div>
                        <p class="form-help">Minimum 6 characters</p>
                    </div>

                    <div id="auth-error" class="form-error" style="display: none;"></div>

                    <button type="submit" class="btn btn-primary btn-block btn-lg">
                        <span id="auth-btn-text">Sign In</span>
                        <span id="auth-loading" class="hidden">Loading...</span>
                    </button>
                </form>

                <div class="auth-demo" style="margin-top: 1.5rem; padding: 1rem; background: rgba(251, 191, 36, 0.05); border-radius: 0.75rem; text-align: center;">
                    <p style="font-size: 0.8125rem; color: var(--text-secondary);">
                        👋 Enter <span style="color: var(--primary);">any email</span> and <span style="color: var(--primary);">password (6+ chars)</span> to get started
                    </p>
                </div>
            </div>
        </div>
    `;

    // Tab switching
    const tabs = container.querySelectorAll('.auth-tab');
    const form = container.querySelector('#auth-form');
    const fullnameGroup = container.querySelector('#fullname-group');
    const btnText = container.querySelector('#auth-btn-text');
    let isLogin = true;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            isLogin = tab.dataset.tab === 'login';
            fullnameGroup.style.display = isLogin ? 'none' : 'block';
            btnText.textContent = isLogin ? 'Sign In' : 'Sign Up';
        });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = container.querySelector('#email').value;
        const password = container.querySelector('#password').value;
        const fullname = container.querySelector('#fullname')?.value || "";
        const errorEl = container.querySelector('#auth-error');
        const btn = form.querySelector('button[type="submit"]');

        // Show loading
        btn.disabled = true;
        container.querySelector('#auth-btn-text').classList.add('hidden');
        container.querySelector('#auth-loading').classList.remove('hidden');

        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
               if (!fullname) {
    throw new Error("Full name required");
}

await signUp(email, password, fullname);
            }

            // Redirect to dashboard
           setTimeout(() => {
    window.location.reload();
}, 500);
        } catch (error) {
    console.error("AUTH ERROR:", error);

    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
} finally {
            btn.disabled = false;
            container.querySelector('#auth-btn-text').classList.remove('hidden');
            container.querySelector('#auth-loading').classList.add('hidden');
        }
    });
}
