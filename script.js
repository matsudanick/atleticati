const SUPABASE_URL = 'https://bsmrjrvsrxcxtcrfidnf.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_7327aTTH-DumueOc5O6nUQ___V9MAI6';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let cart = [];
let currentUser = null;

window.onload = async function() {
    await checkUserSession(); 
};

async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const isCadastroPage = window.location.pathname.includes('cadastro.html');

    if (session) {
        currentUser = session.user;
        if (isCadastroPage) {
            window.location.href = 'index.html';
            return;
        }

        updateUserUI(true);
        if(document.getElementById('aba-novidades')) mudarAba('aba-novidades');
    } else {
        updateUserUI(false);
        if (!isCadastroPage && document.getElementById('aba-auth')) {
            mudarAba('aba-auth');
        }
    }
}

function updateUserUI(isLoggedIn) {
    const navbar = document.getElementById('navbar');
    const btnMobile = document.getElementById('btn-mobile-menu');
    const usernameSpan = document.getElementById('username-span');

    if (navbar && usernameSpan) {
        if (isLoggedIn && currentUser) {
            const firstName = currentUser.user_metadata.first_name || currentUser.email.split('@')[0];
            usernameSpan.innerText = firstName;
            navbar.style.display = 'flex';
            
            if(window.innerWidth <= 768 && btnMobile) {
                btnMobile.style.display = 'block';
            }
        } else {
            navbar.style.display = 'none';
            if(btnMobile) btnMobile.style.display = 'none';
        }
    }
}

function mudarAba(idAba) {
    const abas = document.querySelectorAll('.secao-aba');
    abas.forEach(aba => {
        aba.style.display = 'none';
    });
    
    const abaAlvo = document.getElementById(idAba);
    if(abaAlvo) abaAlvo.style.display = 'block';
    
    const nav = document.getElementById('navbar');
    if(nav) nav.classList.remove('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function recuperarSenha() {
    const email = document.getElementById('input-email-login').value;
    if (!email) {
        alert("Por favor, digite seu e-mail antes.");
        return;
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, 
    });
    if (error) alert("Erro: " + error.message);
    else alert("E-mail de recuperação enviado!");
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.querySelector('#form-login button[type="submit"]');
    btn.innerText = 'Processando...';
    btn.disabled = true;

    try {
        const email = document.getElementById('input-email-login').value;
        const password = document.getElementById('input-pass-login').value;
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) throw error;
        
        currentUser = data.user;
        alert('Acesso Liberado!');
        checkUserSession();

    } catch (error) {
        alert('Erro: ' + error.message);
    } finally {
        btn.innerText = 'Acessar Portal';
        btn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = document.querySelector('#form-register button[type="submit"]');
    btn.innerText = 'Criando conta...';
    btn.disabled = true;

    try {
        const nome = document.getElementById('input-nome').value;
        const sobrenome = document.getElementById('input-sobrenome').value;
        const rgm = document.getElementById('input-rgm').value;
        const phone = document.getElementById('input-phone').value;
        const email = document.getElementById('input-email-reg').value;
        const password = document.getElementById('input-pass-reg').value;

        const { data, error } = await supabaseClient.auth.signUp({
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

        if (data.user) {
            const { error: profileError } = await supabaseClient.from('profiles').insert([{
                id: data.user.id,
                full_name: `${nome} ${sobrenome}`,
                first_name: nome,
                last_name: sobrenome,
                phone: phone,
                rgm: rgm
            }]);

            if (profileError) throw profileError;
        }

        alert('Cadastro realizado! Se o e-mail de confirmação estiver ativo, verifique sua caixa de entrada.');
        window.location.href = 'index.html';

    } catch (error) {
        alert('Erro no cadastro: ' + error.message);
    } finally {
        btn.innerText = 'Finalizar Cadastro';
        btn.disabled = false;
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.reload(); 
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    if(sidebar) sidebar.classList.toggle('open');
}

function addToCart(name, price) {
    cart.push({ name, price });
    updateCartUI();
    const sidebar = document.getElementById('cart-sidebar');
    if(sidebar && !sidebar.classList.contains('open')) sidebar.classList.add('open');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartCountSpan = document.getElementById('cart-count');
    const cartTotalSpan = document.getElementById('cart-total');
    if(!cartItemsDiv) return;

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
    if(cart.length === 0) return alert("Carrinho vazio!");
    
    const meta = currentUser.user_metadata;
    const userName = meta.full_name || currentUser.email;
    const userRgm = meta.rgm || "Não informado";

    let message = `Olá AAATI! Sou *${userName}* (RGM: ${userRgm}) e quero fechar o pedido:%0A`;
    let total = 0;

    cart.forEach(item => {
        message += `- ${item.name} (R$ ${item.price.toFixed(2)})%0A`;
        total += item.price;
    });

    message += `%0ATotal: *R$ ${total.toFixed(2)}*%0A%0AQual a chave PIX?`;
    window.open(`https://wa.me/5511942624463?text=${message}`, '_blank');
}

function toggleMenu() {
    const nav = document.getElementById('navbar');
    if(nav) nav.classList.toggle('active');
}

async function inscreverPalestra(idPalestra) {
    const meta = currentUser.user_metadata;
    try {
        const { error } = await supabaseClient.from('inscricoes_palestra').insert([{ 
            rgm_aluno: meta.rgm, nome_aluno: meta.full_name, id_palestra: idPalestra
        }]);

        if (error) {
            if (error.code === '23505') alert("Você já está inscrito! 💜");
            else throw error;
        } else {
            alert(`✅ Sucesso, ${meta.first_name}! Vaga garantida.`);
        }
    } catch (error) {
        alert("Erro ao realizar inscrição.");
    }
}