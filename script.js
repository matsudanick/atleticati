// =========================================================
// 1. CONFIGURAÇÃO DO SUPABASE
// =========================================================
const supabaseUrl = 'https://bsmrjrvsrxcxtcrfidnf.supabase.co';
const supabaseKey = 'sb_secret_NKxToRDxGqE0YSa2SbBZOQ_Lh48-C1C';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// =========================================================
// 2. RECUPERAÇÃO DE SENHA (DETECÇÃO)
// =========================================================
// Verifica se o usuário chegou pelo link de redefinição de senha
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        document.getElementById('navbar').style.display = 'none';
        mudarAba('aba-nova-senha');
    }
});

window.addEventListener('load', () => {
    if (window.location.hash.includes('type=recovery')) {
        document.getElementById('navbar').style.display = 'none';
        mudarAba('aba-nova-senha');
    }
});

async function salvarNovaSenha(event) {
    event.preventDefault();

    const novaSenha = document.getElementById('input-nova-senha').value;
    const confirmaSenha = document.getElementById('input-confirma-senha').value;

    if (novaSenha !== confirmaSenha) {
        alert("As senhas não coincidem.");
        return;
    }
    if (novaSenha.length < 6) {
        alert("A senha precisa ter pelo menos 6 caracteres.");
        return;
    }

    const { data, error } = await supabase.auth.updateUser({ password: novaSenha });

    if (error) {
        alert("Erro: " + error.message);
    } else {
        alert("Senha atualizada! Bem-vindo.");
        mudarAba('aba-novidades');
        if (window.innerWidth > 768) {
            document.getElementById('navbar').style.display = 'flex';
        }
    }
}

async function recuperarSenha() {
    const email = document.getElementById('input-email-login').value;
    if (!email) {
        alert('Digite seu e-mail institucional no campo acima primeiro.');
        return;
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
        alert('Erro ao enviar e-mail: ' + error.message);
    } else {
        alert('Enviamos um link de recuperação para o seu e-mail!');
    }
}

// =========================================================
// 3. INTERFACE GERAL (ABAS E MENU)
// =========================================================
function mudarAba(idAba) {
    const abas = document.querySelectorAll('.secao-aba');
    abas.forEach(aba => aba.style.display = 'none');
    document.getElementById(idAba).style.display = 'block';
    
    // Se saiu das telas de autenticação, mostra o menu e o toggle
    if(idAba !== 'aba-auth' && idAba !== 'aba-nova-senha') {
        document.getElementById('btn-mobile-menu').style.display = 'block';
        if (window.innerWidth > 768) {
            document.getElementById('navbar').style.display = 'flex';
        }
    }
}

function toggleMenu() {
    const nav = document.getElementById('navbar');
    if (nav.style.display === 'none' || nav.style.display === '') {
        nav.style.display = 'flex';
        nav.classList.add('active');
    } else {
        nav.style.display = 'none';
        nav.classList.remove('active');
    }
}

// Fecha o menu automaticamente no mobile ao clicar em um link
document.querySelectorAll('#navbar a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            const nav = document.getElementById('navbar');
            nav.style.display = 'none';
            nav.classList.remove('active');
        }
    });
});

// =========================================================
// 4. CARRINHO DE COMPRAS
// =========================================================
let carrinho = [];

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    sidebar.classList.toggle('open');
}

function addToCart(nome, preco) {
    carrinho.push({ nome, preco });
    atualizarCarrinho();
    alert(nome + " adicionado ao carrinho!");
}

function removerItem(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
}

function atualizarCarrinho() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    cartCount.innerText = carrinho.length;
    
    if (carrinho.length === 0) {
        cartItems.innerHTML = '<p class="empty-msg">Seu carrinho está vazio.</p>';
        cartTotal.innerText = 'R$ 0,00';
        return;
    }

    let html = '';
    let total = 0;

    carrinho.forEach((item, index) => {
        total += item.preco;
        html += `
            <div class="cart-item">
                <span>${item.nome}</span>
                <div>
                    <span>R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
                    <span class="remove-item material-icons" onclick="removerItem(${index})">delete</span>
                </div>
            </div>
        `;
    });

    cartItems.innerHTML = html;
    cartTotal.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function checkout() {
    if (carrinho.length === 0) {
        alert("Adicione itens ao carrinho primeiro!");
        return;
    }
    let msg = "Olá, Atlética T.I.! Quero fechar o seguinte pedido:%0A";
    let total = 0;
    carrinho.forEach(item => {
        msg += `- ${item.nome} (R$ ${item.preco.toFixed(2)})%0A`;
        total += item.preco;
    });
    msg += `%0A*Total: R$ ${total.toFixed(2)}*`;
    
    // Substitua pelo número do WhatsApp oficial
    window.open(`https://wa.me/5511999999999?text=${msg}`, '_blank');
}