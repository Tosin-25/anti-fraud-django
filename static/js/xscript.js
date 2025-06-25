const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Make sure this matches your Django server's address and API prefix

let currentUser = localStorage.getItem('currentUsername');
let currentRole = localStorage.getItem('currentRole');
let currentUserId = localStorage.getItem('currentUserId'); // Store user ID for admin filtering

const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other Income'];
const expenseCategories = ['Food', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Other Expense'];



// UI Navigation Functions
function showUserLogin() {
    hideAllSections();
    document.getElementById('userLoginPage').classList.add('active');
    // document.getElementById('mainContainer').className = 'container';
                document.body.classList.remove('dashboard-active');
}

function showUserSignup() {
    hideAllSections();
    document.getElementById('userSignupPage').classList.add('active');
    // document.getElementById('mainContainer').className = 'container';
                document.body.classList.remove('dashboard-active');
}

function showAdminLogin() {
    hideAllSections();
    document.getElementById('adminLoginPage').classList.add('active');
   
                document.body.classList.remove('dashboard-active');
}

function hideAllSections() {
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => section.classList.remove('active'));
}


function showMessage(message, type = 'info') {
    const container = document.body; // Or a specific message container
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
        // Optional: remove element after transition
        // setTimeout(() => messageBox.remove(), 300);
    }, 3000);
}


// UI Helper Functions
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

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const transactionType = document.getElementById('transactionType');
    if (transactionType) {
        transactionType.addEventListener('change', updateCategoryDropdown);
    }
    showUserLogin();
});

// Login Functions
async function userLogin() { // Make it async
    const username = document.getElementById('userUsername').value.trim();
    const password = document.getElementById('userPassword').value.trim();

    if (!username || !password) {
        showMessage('Please enter both username and password', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store user info and token in localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUsername', data.username);
            localStorage.setItem('currentUserId', data.user_id);
            localStorage.setItem('currentFullName', data.full_name); // Store full name if available
            
            currentUser = data.username;
            currentUserId = data.user_id;
            currentRole = data.is_admin ? 'admin' : 'user'; // Assuming your login response includes 'is_admin' or similar
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


async function userSignup() { // Make it async
    const fullName = document.getElementById('signupFullName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirmPassword = document.getElementById('signupConfirmPassword').value.trim();

    // Basic frontend validation (keep this for immediate feedback)
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
                username,
                email,
                full_name: fullName, // Ensure this matches your Django serializer field
                password,
                confirm_password: confirmPassword
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
            showUserLogin();
        } else {
            // Handle registration errors from the backend (e.g., username/email taken, validation errors)
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


async function adminLogin() { // Make it async
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    if (!username || !password) {
        showMessage('Please enter both admin ID and password', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Assuming your Django login view returns `is_admin: true` for admin users
            // You might need to add this field to your UserLoginSerializer in Django
            const isAdmin = data.is_admin || false; // Default to false if not provided

            if (!isAdmin) {
                showMessage('Access Denied: This account does not have admin privileges.', 'error');
                return;
            }

            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUsername', data.username);
            localStorage.setItem('currentUserId', data.user_id);
            localStorage.setItem('currentFullName', data.full_name);
            localStorage.setItem('currentRole', 'admin');

            currentUser = data.username;
            currentUserId = data.user_id;
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

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentFullName');
    localStorage.removeItem('currentRole');

    currentUser = null;
    currentUserId = null;
    currentRole = null;
    
    // Clear all form fields
    document.getElementById('userUsername').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('signupFullName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupUsername').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupConfirmPassword').value = '';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    
    showMessage('Logged out successfully.', 'info');
    showUserLogin();
}

// Dashboard Display Functions
function showUserDashboard() {
    hideAllSections();
    document.getElementById('userDashboard').classList.add('active');
    document.body.classList.add('dashboard-active');
    // Use the stored full name, or username if full name isn't available
    document.getElementById('currentUser').textContent = localStorage.getItem('currentFullName') || localStorage.getItem('currentUsername');
    updateCategoryDropdown();
    updateUserStats(); // This will now fetch from backend
    displayUserTransactions(); // This will now fetch from backend
}

async function showAdminDashboard() { // Make it async
    hideAllSections();
    document.getElementById('adminDashboard').classList.add('active');
    document.body.classList.add('dashboard-active');
    document.getElementById('currentAdmin').textContent = localStorage.getItem('currentFullName') || localStorage.getItem('currentUsername');
    
    await updateAdminStats(); // Wait for stats to load
    await populateUserFilter(); // Wait for user filter to load
    await displayAdminTransactions(); // Wait for transactions to load
}

// Transaction Management Functions
async function addTransaction() { // Make it async
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const description = document.getElementById('transactionDescription').value;

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
                'Authorization': `Token ${authToken}` // Include the token
            },
            body: JSON.stringify({
                type: type,
                amount: amount,
                category: category,
                description: description.trim()
                // user, date, timestamp are set by the backend
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Clear form
            document.getElementById('transactionAmount').value = '';
            document.getElementById('transactionCategory').value = '';
            document.getElementById('transactionDescription').value = '';

            showMessage('✅ Transaction added successfully!', 'success');
            // Refresh stats and list by re-fetching from backend
            await updateUserStats();
            await displayUserTransactions();
        } else {
            let errorMessage = 'Failed to add transaction.';
            if (data.detail) errorMessage = data.detail; // DRF common error message
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

// Statistics Display Functions
// Statistics Display Functions
async function updateUserStats() { // Make it async
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
        const transactions = await response.json(); // This will be user-specific due to backend filtering

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0); // Ensure amount is parsed as float
        
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

async function updateAdminStats() { // Make it async
    const authToken = localStorage.getItem('authToken');
    if (!authToken || currentRole !== 'admin') {
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('totalTransactions').textContent = '0';
        document.getElementById('systemTotal').textContent = `$0.00`;
        return;
    }

    try {
        // Fetch all users for total user count
        const usersResponse = await fetch(`${API_BASE_URL}/users/`, { // Assuming /api/users/ endpoint lists all users for admin
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

// Transaction Display Functions
async function displayUserTransactions() { // Make it async
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
        const userTransactions = await response.json(); // Backend filters for current user

        if (userTransactions.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">No transactions yet. Add your first transaction above!</div>';
            return;
        }

        // Sort by timestamp (already handled by Django's ordering in model Meta)
        // userTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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

async function displayAdminTransactions() { // Make it async
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
        params.push(`user_id=${userFilter}`); // Pass user_id, not username
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


// Filter Functions
// Filter Functions
async function populateUserFilter() { // Make it async
    const select = document.getElementById('userFilter');
    select.innerHTML = '<option value="">All Users</option>'; // Always start with "All Users"

    const authToken = localStorage.getItem('authToken');
    if (!authToken || currentRole !== 'admin') {
        return; // Only populate for admins
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/`, { // Assuming this endpoint lists all users for admin
            method: 'GET',
            headers: {
                'Authorization': `Token ${authToken}`
            }
        });
        const usersData = await response.json();

        // Assuming usersData is an array of user objects with 'id' and 'username'
        usersData.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id; // Use user.id for filtering in backend
            option.textContent = user.full_name || user.username; // Display full name or username
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating user filter:', error);
        showMessage('Failed to load user list for filtering.', 'error');
    }
}

// getFilteredTransactions() is no longer needed as filtering is done by the backend
// So, you can remove the entire getFilteredTransactions() function.

function applyFilters() {
    // This function now just triggers a re-display, which will re-fetch with filters
    displayAdminTransactions();
}
// Event Listeners
document.addEventListener('DOMContentLoaded', async function() { // Make it async
    const transactionType = document.getElementById('transactionType');
    if (transactionType) {
        transactionType.addEventListener('change', updateCategoryDropdown);
    }
    
    const authToken = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('currentRole');

    if (authToken && storedRole) {
        // Attempt to verify token or just assume valid for now
        // In a real app, you might have an API endpoint to verify the token
        currentUser = localStorage.getItem('currentUsername');
        currentUserId = localStorage.getItem('currentUserId');
        currentRole = storedRole;

        if (currentRole === 'admin') {
            await showAdminDashboard(); // Use await
        } else {
            await showUserDashboard(); // Use await
        }
    } else {
        showUserLogin();
    }
});