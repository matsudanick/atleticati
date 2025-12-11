const SUPABASE_URL = 'https://jbtosmglvumkobuyxopl.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidG9zbWdsdnVta29idXl4b3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzUwNTAsImV4cCI6MjA4MTA1MTA1MH0.BzZj4NI39mhyUgiFU6QrxWKf6z8llZ6Mj6gjXv7QlUM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let cart = [];
let currentUser = null;
let isLoginMode = true;

window.onload = async function() {
    checkUserSession(); 
};

async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        updateUserUI(true);
    } else {
        updateUserUI(false);
    }
}

function updateUserUI(isLoggedIn) {
    const userDisplay = document.getElementById('user-display');
    const loginBtn = document.getElementById('login-btn');
    const usernameSpan = document.getElementById('username-span');

    if (isLoggedIn && currentUser) {
        const firstName = currentUser.user_metadata.first_name || currentUser.email.split('@')[0];
        usernameSpan.innerText = firstName;
        
        userDisplay.style.display = 'inline-flex';
        userDisplay.style.alignItems = 'center';
        loginBtn.style.display = 'none';
    } else {
        userDisplay.style.display = 'none';
        loginBtn.style.display = 'inline-block';
    }
}

function openLogin() {
    document.getElementById('login-modal').style.display = 'flex';
}

function closeLogin() {
    document.getElementById('login-modal').style.display = 'none';
    isLoginMode = true;
    updateModalText();
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateModalText();
}

function updateModalText() {
    const title = document.getElementById('modal-title');
    const btn = document.getElementById('submit-btn');
    const switchText = document.getElementById('switch-text');
    const switchLink = document.getElementById('switch-link');
    const extraFields = document.getElementById('extra-fields');

    if (isLoginMode) {
        title.innerHTML = 'Acesso <span class="highlight">Membro</span>';
        btn.innerText = 'Entrar';
        switchText.innerText = 'Não tem conta?';
        switchLink.innerText = 'Cadastre-se';
        extraFields.style.display = 'none'; 
    } else {
        title.innerHTML = 'Novo <span class="highlight">Sócio</span>';
        btn.innerText = 'Cadastrar';
        switchText.innerText = 'Já tem conta?';
        switchLink.innerText = 'Fazer Login';
        extraFields.style.display = 'block'; 
    }
}

async function handleAuth(e) {
    e.preventDefault();
    
    const email = document.getElementById('input-email').value;
    const password = document.getElementById('input-pass').value;
    
    const nome = document.getElementById('input-nome').value;
    const sobrenome = document.getElementById('input-sobrenome').value;
    const phone = document.getElementById('input-phone').value;
    const rgm = document.getElementById('input-rgm').value;

    const btn = document.getElementById('submit-btn');
    btn.innerText = 'Processando...';
    btn.disabled = true;

    try {
        if (isLoginMode) {
            // --- LOGIN ---
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            
            currentUser = data.user;
            alert('Bem-vindo de volta!');
            updateUserUI(true);
            closeLogin();

        } else {
            
            if(!nome || !sobrenome || !phone || !rgm) {
                throw new Error("Por favor, preencha Nome, Sobrenome, Celular e RGM.");
            }

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: nome,
                        last_name: sobrenome,
                        full_name: `${nome} ${sobrenome}`,
                        phone: phone,
                        rgm: rgm
                    }
                }
            });

            if (error) throw error;

            alert('Cadastro realizado! Verifique seu e-mail ou faça login.');
            toggleAuthMode();
        }
    } catch (error) {
        alert('Erro: ' + error.message);
    } finally {
        btn.innerText = isLoginMode ? 'Entrar' : 'Cadastrar';
        btn.disabled = false;
    }
}

async function logout() {
    await supabase.auth.signOut();
    window.location.reload(); 
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
}

function addToCart(name, price) {
    cart.push({ name, price });
    updateCartUI();
    const sidebar = document.getElementById('cart-sidebar');
    if(!sidebar.classList.contains('open')) sidebar.classList.add('open');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartCountSpan = document.getElementById('cart-count');
    const cartTotalSpan = document.getElementById('cart-total');
    
    cartItemsDiv.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-msg">Seu carrinho está vazio.</p>';
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <div>${item.name}</div>
                <div>R$ ${item.price.toFixed(2)} <span class="remove-item" onclick="removeFromCart(${index})">X</span></div>
            `;
            cartItemsDiv.appendChild(itemElement);
        });
    }

    cartCountSpan.innerText = cart.length;
    cartTotalSpan.innerText = `R$ ${total.toFixed(2)}`;
}

function checkout() {
    if(cart.length === 0) {
        alert("Carrinho vazio!");
        return;
    }

    if(!currentUser) {
        alert("Você precisa fazer Login para finalizar a compra!");
        openLogin();
        return;
    }

    const meta = currentUser.user_metadata;
    const userName = meta.full_name || (meta.first_name + ' ' + meta.last_name) || currentUser.email;
    const userRgm = meta.rgm || "Não informado";

    let message = `Olá AAATI! Sou *${userName}* (RGM: ${userRgm}) e quero fechar o pedido:%0A`;
    let total = 0;

    cart.forEach(item => {
        message += `- ${item.name} (R$ ${item.price.toFixed(2)})%0A`;
        total += item.price;
    });

    message += `%0ATotal: *R$ ${total.toFixed(2)}*`;
    message += `%0A%0AQual a chave PIX?`;

    const phoneNumber = "5511942624463"; 
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
}

function toggleMenu() {
    document.getElementById('navbar').classList.toggle('active');
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if(this.getAttribute('href') !== '#') {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({ behavior: 'smooth' });
                document.getElementById('navbar').classList.remove('active');
            }
        }
    });
});