const BASE_URL = "http://localhost:3000";
let activeFormId = null;

function getPublicFormUrl(formId) {
    return new URL(`form.html?id=${formId}`, window.location.href).toString();
}

function getAuthHeaderValue() {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return null;
    return storedToken.startsWith("Bearer ") ? storedToken : `Bearer ${storedToken}`;
}

// Toast Utility
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// UI Tabs
function switchTab(tab) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.add('hidden');
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-signup').classList.remove('active');

    if (tab === 'login') {
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('tab-login').classList.add('active');
    } else {
        document.getElementById('signup-section').classList.remove('hidden');
        document.getElementById('tab-signup').classList.add('active');
    }
}

// Auth API
async function signup() {
    const email = document.getElementById('signupMail').value;
    const password = document.getElementById('signupPassword').value;
    const btn = document.getElementById('signupBtn');
    
    if (!email || !password) {
        return showToast("Please fill all fields", "error");
    }

    try {
        btn.disabled = true;
        btn.textContent = "Signing up...";
        
        const res = await fetch(BASE_URL + "/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast("Account created! Please log in.", "success");
            switchTab('login');
        } else {
            showToast(data.message || (data.error && data.error[0].message) || "Signup failed", "error");
        }
    } catch (err) {
        showToast("Network error", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Sign Up";
    }
}

async function login() {
    const email = document.getElementById('loginMail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        return showToast("Please fill all fields", "error");
    }

    try {
        btn.disabled = true;
        btn.textContent = "Logging in...";

        const res = await fetch(BASE_URL + "/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            if (!data.token) {
                showToast("Login succeeded but no token was returned", "error");
                return;
            }
            const normalizedToken = data.token && data.token.startsWith("Bearer ")
                ? data.token
                : `Bearer ${data.token}`;
            localStorage.setItem("token", normalizedToken);
            showToast("Logged in successfully!", "success");
            setTimeout(() => {
                window.location.href = "create.html";
            }, 500);
        } else {
            showToast(data.msg || data.message || "Login failed", "error");
        }
    } catch (err) {
        showToast("Network error", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Login";
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

// Dashboard API
async function createForm() {
    const title = document.getElementById('title').value;
    const btn = document.getElementById('createFormBtn');

    if (!title) {
        return showToast("Please enter a title", "error");
    }

    try {
        btn.disabled = true;
        btn.textContent = "Creating...";

        const res = await fetch(BASE_URL + "/form", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getAuthHeaderValue()
            },
            body: JSON.stringify({ title })
        });
        const data = await res.json();
        
        if (res.ok) {
            document.getElementById('title').value = '';
            showToast("Form created successfully!", "success");
            
            await loadUserForms(); 
            selectForm(data.formId, title);
        } else {
            showToast(data.message || "Error creating form", "error");
        }
    } catch (err) {
        showToast("Network error", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Create Form";
    }
}

async function loadUserForms() {
    const list = document.getElementById('forms-list');
    const noText = document.getElementById('noFormsText');
    if(!list) return;
    
    try {
        const res = await fetch(BASE_URL + "/forms", {
            headers: { "Authorization": getAuthHeaderValue() }
        });
        const data = await res.json();
        
        if (res.ok) {
            if (data.forms.length > 0) {
                if (noText) noText.classList.add('hidden');
                list.innerHTML = data.forms.map(f => `
                    <div id="form-item-${f._id}" onclick="selectForm('${f._id}', '${f.title.replace(/'/g, "\\'")}')" class="form-item" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;">
                        <span style="font-weight: 500;">${f.title}</span>
                        <small style="color: #94a3b8;">${new Date(f.createdAt || Date.now()).toLocaleDateString()}</small>
                    </div>
                `).join('');

                // Auto select logic
                if (!activeFormId || !data.forms.find(f => f._id === activeFormId)) {
                    selectForm(data.forms[0]._id, data.forms[0].title);
                } else {
                    const currentForm = data.forms.find(f => f._id === activeFormId);
                    selectForm(currentForm._id, currentForm.title);
                }
            } else {
                if (noText) noText.classList.remove('hidden');
                list.innerHTML = '';
            }
        }
    } catch (err) {
        showToast("Failed to load your forms", "error");
    }
}

window.selectForm = function(id, title) {
    activeFormId = id;
    
    // Highlight UI
    document.querySelectorAll('.form-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById('form-item-' + id);
    if(activeEl) activeEl.classList.add('active');
    
    document.getElementById('responses-header-text').textContent = `Responses: ${title}`;
    
    const linkUrl = getPublicFormUrl(id);
    document.getElementById('link-container').classList.remove('hidden');
    document.getElementById('link').href = linkUrl;
    document.getElementById('link').innerText = linkUrl;
            
    loadFeedbacks(id);
}

async function loadFeedbacks(formId) {
    if (!formId) return;
    const list = document.getElementById('feedback-list');
    const noText = document.getElementById('noFormSelectedText');
    
    try {
        const res = await fetch(BASE_URL + "/feedback/" + formId, {
            headers: { "Authorization": getAuthHeaderValue() }
        });
        const data = await res.json();
        
        if (res.ok) {
            if (data.allFeedbacks.length > 0) {
                noText.classList.add('hidden');
                list.innerHTML = data.allFeedbacks.map(f => `
                    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 12px;">
                        <p style="margin-bottom: 8px; font-size: 15px; word-break: break-word;">${f.message}</p>
                        <small style="color: #94a3b8; font-size: 12px;">${new Date(f.createdAt || Date.now()).toLocaleString()}</small>
                    </div>
                `).reverse().join('');
            } else {
                noText.classList.remove('hidden');
                noText.textContent = "No responses yet.";
                list.innerHTML = '';
            }
        }
    } catch (err) {
        showToast("Failed to load feedbacks", "error");
    }
}

function refreshFeedbacks() {
    if (activeFormId) {
        loadFeedbacks(activeFormId);
        showToast("Refreshed", "success");
        loadUserForms(); // Refresh forms list too
    } else {
        showToast("Select or create a form first", "info");
    }
}

function copyLink() {
    const link = document.getElementById('link').innerText;
    navigator.clipboard.writeText(link).then(() => {
        showToast("Link copied to clipboard!", "success");
    });
}

// Feedback Form API (form.html)
if(window.location.pathname.endsWith("form.html")) {
    const params = new URLSearchParams(window.location.search);
    const formId = params.get("id");
    
    async function loadFormDetails() {
        if (!formId) {
            document.getElementById("title").innerText = "Invalid Link";
            return;
        }

        try {
            const res = await fetch(BASE_URL + "/form/" + formId);
            const data = await res.json();
            
            if (res.ok) {
                document.getElementById("title").innerText = data.title;
            } else {
                document.getElementById("title").innerText = "Form not found";
            }
        } catch (err) {
            document.getElementById("title").innerText = "Error loading form";
        }
    }

    loadFormDetails();

    window.submitFeedback = async function() {
        const message = document.getElementById("message").value;
        const btn = document.getElementById("submitBtn");

        if (!message.trim()) {
            return showToast("Please write a message", "error");
        }

        if (!formId) {
            return showToast("Invalid form", "error");
        }

        try {
            btn.disabled = true;
            btn.textContent = "Sending...";

            const res = await fetch(BASE_URL + "/feedback/" + formId, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });
            const data = await res.json();

            if (res.ok) {
                document.getElementById('feedback-panel').classList.add('hidden');
                document.getElementById('success-state').classList.remove('hidden');
            } else {
                showToast(data.message || "Failed to submit", "error");
            }
        } catch (err) {
             showToast("Network error", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Send Anonymously";
        }
    }
}