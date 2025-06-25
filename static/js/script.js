// Global constants for API base URL and categories
const API_BASE_URL = 'http://127.0.0.1:8000/api'; // IMPORTANT: Ensure this matches your Django server's address and API prefix

const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other Income'];
const expenseCategories = ['Food', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Other Expense'];

// Global variables for current user state, initialized from localStorage for persistence
let currentUserEmail = localStorage.getItem('currentUserEmail'); 
let currentUsername = localStorage.getItem('currentUsername'); 
let currentRole = localStorage.getItem('currentRole');
let currentUserId = localStorage.getItem('currentUserId'); 
let currentFullName = localStorage.getItem('currentFullName'); 

// --- UI Navigation Functions ---

/**
 * Hides all page sections.
 */
function hideAllSections() {
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => section.classList.remove('active'));
}

/**
 * Shows the user login page.
 */
function showUserLogin() {
    hideAllSections();
    document.getElementById('userLoginPage').classList.add('active');
    document.body.classList.remove('dashboard-active');
}

/**
 * Shows the user signup page.
 */
function showUserSignup() {
    hideAllSections();
    document.getElementById('userSignupPage').classList.add('active');
    document.body.classList.remove('dashboard-active');
}

/**
 * Shows the admin login page.
 */
function showAdminLogin() {
    hideAllSections();
    document.getElementById('adminLoginPage').classList.add('active');
    document.body.classList.remove('dashboard-active');
}

/**
 * Shows the user dashboard and updates its content.
 */
async function showUserDashboard() {
    hideAllSections();
    document.getElementById('userDashboard').classList.add('active');
    document.body.classList.add('dashboard-active');
    // Display the user's full name or username
    document.getElementById('currentUser').textContent = currentFullName || currentUsername || currentUserEmail;
    updateCategoryDropdown();
    await updateUserStats(); // Fetch and update user statistics
    await displayUserTransactions(); // Fetch and display user transactions
}

/**
 * Shows the admin dashboard and updates its content.
 */
async function showAdminDashboard() {
    hideAllSections();
    document.getElementById('adminDashboard').classList.add('active');
    document.body.classList.add('dashboard-active');
    // Display the admin's full name or username
    document.getElementById('currentAdmin').textContent = currentFullName || currentUsername || currentUserEmail;
    await updateAdminStats(); // Fetch and update admin statistics
    await populateUserFilter(); // Populate user filter dropdown
    await displayAdminTransactions(); // Fetch and display all transactions (with filters)
}

// --- UI Helper Functions ---

/**
 * Displays a custom message box at the top right of the screen.
 * @param {string} message - The message to display.
 * @param {'info'|'success'|'error'} type - The type of message (influences styling).
 */
function showMessage(message, type = 'info') {
    const container = document.body;
    let messageBox = document.getElementById('customMessageBox');

    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'customMessageBox';
        messageBox.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 1rem;
            font-weight: bold;
            color: white;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            opacity: 0;
            transform: translateY(-20px);
            transition: opacity 0.3s ease-out, transform 0.3s ease-out;
        `;
        container.appendChild(messageBox);
    }

    messageBox.textContent = message;
    if (type === 'success') {
        messageBox.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    } else if (type === 'error') {
        messageBox.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
    } else {
        messageBox.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    messageBox.style.opacity = 1;
    messageBox.style.transform = 'translateY(0)';

    setTimeout(() => {
        messageBox.style.opacity = 0;
        messageBox.style.transform = 'translateY(-20px)';
    }, 3000);
}

/**
 * Populates the transaction category dropdown based on the selected transaction type.
 */
function updateCategoryDropdown() {
    const select = document.getElementById('transactionCategory');
    const type = document.getElementById('transactionType').value;
    
    select.innerHTML = '<option value="">Select category</option>';
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

// --- Authentication Functions ---

/**
 * Handles user login by sending credentials (email and password) to the backend API.
 */
async function userLogin() {
    const email = document.getElementById('userEmail').value.trim(); 
    const password = document.getElementById('userPassword').value.trim();

    if (!email || !password) {
        showMessage('Please enter both email and password', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Send email instead of username
            body: JSON.stringify({ email, password }) 
        });

        const data = await response.json();

        if (response.ok) {
            // Store user info and token in localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUserEmail', data.email); 
            localStorage.setItem('currentUsername', data.username); 
            localStorage.setItem('currentUserId', data.user_id);
            localStorage.setItem('currentFullName', data.full_name || data.username || data.email); 

            // Update global state variables
            currentUserEmail = data.email;
            currentUsername = data.username;
            currentUserId = data.user_id;
            currentFullName = data.full_name || data.username || data.email;
            currentRole = data.is_staff ? 'admin' : 'user'; 
            localStorage.setItem('currentRole', currentRole);

            showMessage('Login successful!', 'success');
            if (currentRole === 'admin') {
                showAdminDashboard();
            } else {
                showUserDashboard();
            }
        } else {
            // Handle login errors from the backend
            showMessage(data.error || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showMessage('Network error or server unavailable. Please try again later.', 'error');
    }
}

/**
 * Handles user signup by sending new account details to the backend API.
 */
async function userSignup() {
    const fullName = document.getElementById('signupFullName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const username = document.getElementById('signupUsername').value.trim(); 
    const password = document.getElementById('signupPassword').value.trim();
    const confirmPassword = document.getElementById('signupConfirmPassword').value.trim();

    // Basic frontend validation
    if (!fullName || !email || !username || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                fullName: fullName, // Changed from 'full_name' to 'fullName'
                password: password,
                password2: confirmPassword // Changed from 'confirm_password' to 'password2'
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('✅ Account created successfully! You can now login with your credentials.', 'success');
            // Clear form fields after successful signup
            document.getElementById('signupFullName').value = '';
            document.getElementById('signupEmail').value = '';
            document.getElementById('signupUsername').value = '';
            document.getElementById('signupPassword').value = '';
            document.getElementById('signupConfirmPassword').value = '';
            showUserLogin(); // Redirect to login page
        } else {
            // Handle registration errors from the backend
            let errorMessage = 'Account creation failed.';
            if (data.username) errorMessage += ' Username: ' + data.username.join(', ');
            if (data.email) errorMessage += ' Email: ' + data.email.join(', ');
            if (data.password) errorMessage += ' Password: ' + data.password.join(', ');
            if (data.non_field_errors) errorMessage += ' ' + data.non_field_errors.join(', ');
            showMessage(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        showMessage('Network error or server unavailable. Please try again later.', 'error');
    }
}

/**
 * Handles admin login by sending credentials (email and password) to the backend API.
 */
async function adminLogin() {
    const email = document.getElementById('adminEmail').value.trim(); 
    const password = document.getElementById('adminPassword').value.trim();

    if (!email || !password) {
        showMessage('Please enter both admin email and password', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Send email instead of username
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Assuming your Django login view returns `is_staff: true` for admin users
            const isAdmin = data.is_staff || false;

            if (!isAdmin) {
                showMessage('Access Denied: This account does not have admin privileges.', 'error');
                return;
            }

            // Store admin info and token in localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUserEmail', data.email);
            localStorage.setItem('currentUsername', data.username);
            localStorage.setItem('currentUserId', data.user_id);
            localStorage.setItem('currentFullName', data.full_name || data.username || data.email);
            localStorage.setItem('currentRole', 'admin');

            // Update global state variables
            currentUserEmail = data.email;
            currentUsername = data.username;
            currentUserId = data.user_id;
            currentFullName = data.full_name || data.username || data.email;
            currentRole = 'admin';

            showMessage('Admin login successful!', 'success');
            showAdminDashboard();
        } else {
            let errorMessage = data.error || 'Admin login failed. Invalid credentials.';
            showMessage(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        showMessage('Network error or server unavailable. Please try again later.', 'error');
    }
}

/**
 * Logs out the current user by clearing localStorage and resetting global state.
 */
function logout() {
    // Clear all user-related data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUserEmail'); 
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentFullName');
    localStorage.removeItem('currentRole');

    // Reset global state variables
    currentUserEmail = null;
    currentUsername = null;
    currentUserId = null;
    currentFullName = null;
    currentRole = null;
    
    // Clear all form fields for security and clean UI
    document.getElementById('userEmail').value = ''; 
    document.getElementById('userPassword').value = '';
    document.getElementById('signupFullName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupUsername').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupConfirmPassword').value = '';
    document.getElementById('adminEmail').value = ''; 
    document.getElementById('adminPassword').value = '';
    
    showMessage('Logged out successfully.', 'info');
    showUserLogin(); // Redirect to login page
}

// --- Transaction Management Functions ---

/**
 * Adds a new transaction by sending data to the backend API.
 */
async function addTransaction() {
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const description = document.getElementById('transactionDescription').value;

    // Frontend validation
    if (!amount || amount <= 0) {
        showMessage('Please enter a valid amount greater than 0', 'error');
        return;
    }
    if (!category) {
        showMessage('Please select a category', 'error');
        return;
    }
    if (!description.trim()) {
        showMessage('Please enter a description', 'error');
        return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showMessage('You must be logged in to add transactions.', 'error');
        showUserLogin();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/transactions/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}` // Include the authentication token
            },
            body: JSON.stringify({
                type: type,
                amount: amount,
                category: category,
                description: description.trim()
                // user, date, timestamp are set automatically by the backend
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Clear form fields
            document.getElementById('transactionAmount').value = '';
            document.getElementById('transactionCategory').value = '';
            document.getElementById('transactionDescription').value = '';

            showMessage('✅ Transaction added successfully!', 'success');
            // Refresh user dashboard data by re-fetching from backend
            await updateUserStats();
            await displayUserTransactions();
        } else {
            let errorMessage = 'Failed to add transaction.';
            if (data.detail) errorMessage = data.detail;
            else if (data.amount) errorMessage += ' Amount: ' + data.amount.join(', ');
            else if (data.category) errorMessage += ' Category: ' + data.category.join(', ');
            else if (data.description) errorMessage += ' Description: ' + data.description.join(', ');
            showMessage(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        showMessage('Network error or server unavailable. Please try again later.', 'error');
    }
}

// --- Statistics Display Functions ---

/**
 * Fetches and updates the current user's income, expenses, and net balance from the backend.
 */
async function updateUserStats() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        document.getElementById('totalIncome').textContent = `$0.00`;
        document.getElementById('totalExpenses').textContent = `$0.00`;
        document.getElementById('netBalance').textContent = `$0.00`;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/transactions/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${authToken}`
            }
        });
        const transactions = await response.json(); // Backend automatically filters for the current user

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const netBalance = totalIncome - totalExpenses;

        document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
        document.getElementById('netBalance').textContent = `$${netBalance.toFixed(2)}`;

    } catch (error) {
        console.error('Error fetching user stats:', error);
        showMessage('Failed to load user statistics.', 'error');
    }
}

/**
 * Fetches and updates overall system statistics (total users, transactions, balance) for admin.
 */
async function updateAdminStats() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken || currentRole !== 'admin') {
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('totalTransactions').textContent = '0';
        document.getElementById('systemTotal').textContent = `$0.00`;
        return;
    }

    try {
        // Fetch all users for total user count (assuming /api/users/ endpoint lists all users for admin)
        const usersResponse = await fetch(`${API_BASE_URL}/users/`, {
            method: 'GET',
            headers: { 'Authorization': `Token ${authToken}` }
        });
        const usersData = await usersResponse.json();
        const totalUsers = usersData.length;

        // Fetch all transactions for total transaction count and system balance
        const transactionsResponse = await fetch(`${API_BASE_URL}/transactions/`, {
            method: 'GET',
            headers: { 'Authorization': `Token ${authToken}` }
        });
        const allTransactions = await transactionsResponse.json();

        const totalTransactions = allTransactions.length;
        
        const systemIncome = allTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const systemExpenses = allTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const systemTotal = systemIncome - systemExpenses;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalTransactions').textContent = totalTransactions;
        document.getElementById('systemTotal').textContent = `$${systemTotal.toFixed(2)}`;

    } catch (error) {
        console.error('Error fetching admin stats:', error);
        showMessage('Failed to load admin statistics.', 'error');
    }
}

// --- Transaction Display Functions ---

/**
 * Fetches and displays the current user's transactions.
 */
async function displayUserTransactions() {
    const container = document.getElementById('userTransactionsList');
    container.innerHTML = ''; // Clear previous content
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Please log in to view your transactions.</div>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/transactions/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${authToken}`
            }
        });
        const userTransactions = await response.json(); // Backend automatically filters for the current user

        if (userTransactions.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">No transactions yet. Add your first transaction above!</div>';
            return;
        }

        userTransactions.forEach(transaction => {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.innerHTML = `
                <div>${transaction.date}</div>
                <div class="${transaction.type}">${transaction.type.toUpperCase()}</div>
                <div class="${transaction.type}">$${parseFloat(transaction.amount).toFixed(2)}</div>
                <div>${transaction.description}</div>
                <div>${transaction.category}</div>
            `;
            container.appendChild(row);
        });

    } catch (error) {
        console.error('Error fetching user transactions:', error);
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666; color: #dc3545;">Failed to load transactions.</div>';
    }
}

/**
 * Fetches and displays all transactions for the admin, with optional filtering.
 */
async function displayAdminTransactions() {
    const container = document.getElementById('adminTransactionsList');
    container.innerHTML = ''; // Clear previous content

    const authToken = localStorage.getItem('authToken');
    if (!authToken || currentRole !== 'admin') {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Admin access required to view all transactions.</div>';
        return;
    }

    const userFilter = document.getElementById('userFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    let url = `${API_BASE_URL}/transactions/`;
    const params = [];
    if (userFilter) {
        params.push(`user=${userFilter}`); // Use 'user' for filtering by user ID in Django
    }
    if (typeFilter) {
        params.push(`type=${typeFilter}`);
    }
    if (params.length > 0) {
        url += '?' + params.join('&');
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${authToken}`
            }
        });
        const filteredTransactions = await response.json();

        if (filteredTransactions.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">No transactions found matching the current filters.</div>';
            return;
        }

        filteredTransactions.forEach(transaction => {
            const row = document.createElement('div');
            row.className = 'table-row admin-table';
            row.innerHTML = `
                <div>${transaction.date}</div>
                <div><strong>${transaction.user_username || transaction.user}</strong></div>
                <div class="${transaction.type}">${transaction.type.toUpperCase()}</div>
                <div class="${transaction.type}">$${parseFloat(transaction.amount).toFixed(2)}</div>
                <div>${transaction.description}</div>
                <div>${transaction.category}</div>
            `;
            container.appendChild(row);
        });

    } catch (error) {
        console.error('Error fetching admin transactions:', error);
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666; color: #dc3545;">Failed to load transactions for admin.</div>';
    }
}

// --- Filter Functions ---

/**
 * Populates the user filter dropdown in the admin dashboard by fetching all users from the backend.
 */
async function populateUserFilter() {
    const select = document.getElementById('userFilter');
    select.innerHTML = '<option value="">All Users</option>'; // Always start with "All Users" option

    const authToken = localStorage.getItem('authToken');
    if (!authToken || currentRole !== 'admin') {
        return; // Only populate for authenticated admins
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/`, { // Assuming this endpoint lists all users for admin
            method: 'GET',
            headers: {
                'Authorization': `Token ${authToken}`
            }
        });
        const usersData = await response.json();

        // Assuming usersData is an array of user objects with 'id', 'username', and 'full_name'
        usersData.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id; // Use user.id for filtering in backend
            option.textContent = user.full_name || user.username || user.email; // Display full name or username or email
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating user filter:', error);
        showMessage('Failed to load user list for filtering.', 'error');
    }
}

/**
 * Applies filters on the admin dashboard by re-fetching transactions.
 */
function applyFilters() {
    // This function now just triggers a re-display, which will re-fetch with filters
    displayAdminTransactions();
}

// --- Event Listeners ---

/**
 * Initializes the application when the DOM is fully loaded.
 * Checks for existing authentication token and directs to the appropriate dashboard or login page.
 */
document.addEventListener('DOMContentLoaded', async function() {
    const transactionType = document.getElementById('transactionType');
    if (transactionType) {
        transactionType.addEventListener('change', updateCategoryDropdown);
    }
    
    // Check if an authentication token exists in localStorage
    const authToken = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('currentRole');

    if (authToken && storedRole) {
        // If token exists, assume user is logged in and try to show dashboard
        currentUserEmail = localStorage.getItem('currentUserEmail');
        currentUsername = localStorage.getItem('currentUsername');
        currentUserId = localStorage.getItem('currentUserId');
        currentFullName = localStorage.getItem('currentFullName');
        currentRole = storedRole;

        if (currentRole === 'admin') {
            await showAdminDashboard();
        } else {
            await showUserDashboard();
        }
    } else {
        // No token found, show the login page
        showUserLogin();
    }
});

/**
 * Supports keyboard 'Enter' key press for form submissions.
 */
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const activeSection = document.querySelector('.page-section.active');
        if (activeSection) {
            if (activeSection.id === 'userLoginPage') {
                userLogin();
            } else if (activeSection.id === 'userSignupPage') {
                userSignup();
            } else if (activeSection.id === 'adminLoginPage') {
                adminLogin();
            }
        }
    }
});
