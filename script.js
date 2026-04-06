// =========================================================
// 1. CONFIGURAÇÃO DO SUPABASE
// =========================================================
const supabaseUrl = 'https://bsmrjrvsrxcxtcrfidnf.supabase.co';
// ATENÇÃO: Cole aqui a sua chave "anon" / "public" que começa com "eyJ..."
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbXJqcnZzcnhjeHRjcmZpZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQyNjYzMywiZXhwIjoyMDkxMDAyNjMzfQ.ifbsK4t9XZs5l9lNH1M37q2UlO36seGJexYrQgvrAuc';

// CORREÇÃO AQUI: Mudamos o nome da variável de supabase para supabaseClient
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// =========================================================
// 2. RECUPERAÇÃO DE SENHA (DETECÇÃO)
// =========================================================
supabaseClient.auth.onAuthStateChange((event, session) => {
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

    const { data, error } = await supabaseClient.auth.updateUser({ password: novaSenha });

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

    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email);
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
    
    window.open(`https://wa.me/5511999999999?text=${msg}`, '_blank');
}

// =========================================================
// 5. PAINEL DE PERFIL (DASHBOARD)
// =========================================================
function switchProfileTab(tabId, btnElement) {
    document.querySelectorAll('.profile-section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });

    document.querySelectorAll('.profile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const sectionToShow = document.getElementById(`perfil-${tabId}`);
    sectionToShow.style.display = 'block';
    sectionToShow.classList.add('secao-aba'); 
    
    btnElement.classList.add('active');
}

async function atualizarPerfil(event) {
    event.preventDefault();

    const nome = document.getElementById('perfil-nome').value;
    const sobrenome = document.getElementById('perfil-sobrenome').value;

    document.getElementById('username-span').innerText = nome;
    document.getElementById('profile-name-display').innerText = nome + " " + sobrenome;

    const btn = event.submitter;
    const textoOriginal = btn.innerText;
    btn.innerText = "Salvando...";
    btn.style.opacity = "0.7";

    setTimeout(() => {
        btn.innerText = "Salvo com sucesso!";
        btn.style.background = "#00e676";
        btn.style.color = "#000";
        btn.style.borderColor = "#00e676";
        btn.style.boxShadow = "none";
        
        setTimeout(() => {
            btn.innerText = textoOriginal;
            btn.style = "";
        }, 2000);
    }, 1000);
}

// =========================================================
// 6. AUTENTICAÇÃO REAL (CADASTRO E LOGIN)
// =========================================================

async function handleRegister(event) {
    event.preventDefault(); // Evita a página recarregar

    const email = document.getElementById('input-email-reg').value;
    const password = document.getElementById('input-pass-reg').value;
    const nome = document.getElementById('input-nome').value;
    const sobrenome = document.getElementById('input-sobrenome').value;
    
    // Cadastra o usuário no Supabase
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                first_name: nome,
                last_name: sobrenome
            }
        }
    });

    if (error) {
        alert("Erro ao cadastrar: " + error.message);
    } else {
        alert("Cadastro realizado! Faça login para acessar o portal.");
        window.location.href = "index.html"; // Volta para a tela de login
    }
}

async function handleLogin(event) {
    event.preventDefault(); // Evita a página recarregar

    const email = document.getElementById('input-email-login').value;
    const password = document.getElementById('input-pass-login').value;

    // Tenta fazer o login no Supabase
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Erro ao acessar: " + error.message);
    } else {
        // Atualiza o nome do usuário no menu com os dados reais do banco
        const nomeUsuario = data.user.user_metadata?.first_name || "Sócio";
        document.getElementById('username-span').innerText = nomeUsuario;
        
        mudarAba('aba-novidades');
    }
}

async function logout() {
    if(confirm("Deseja realmente sair da sua conta?")) {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            alert("Erro ao sair: " + error.message);
        } else {
            mudarAba('aba-auth');
            document.getElementById('navbar').style.display = 'none';
            document.getElementById('btn-mobile-menu').style.display = 'none';
        }
    }
}s