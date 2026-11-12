/* ===== Dados (fictícios, para o projeto) ===== */
const SHOWS = [
  { id: "sp", dia: "14", mes: "Mar", cidade: "São Paulo, SP", local: "Allianz Parque · 21h" },
  { id: "fz", dia: "28", mes: "Mar", cidade: "Fortaleza, CE", local: "Marina Park · 21h", esgotando: "pista" },
  { id: "bh", dia: "11", mes: "Abr", cidade: "Belo Horizonte, MG", local: "Mineirão · 20h" },
  { id: "rec", dia: "25", mes: "Abr", cidade: "Recife, PE", local: "Classic Hall · 22h" }
];

const SETORES = [
  { id: "pista", nome: "Pista", desc: "Acesso à área em frente ao palco", preco: 120 },
  { id: "premium", nome: "Pista Premium", desc: "Área próxima ao palco + bar exclusivo", preco: 220 },
  { id: "camarote", nome: "Camarote", desc: "Open bar, open food e vista privilegiada", preco: 380 }
];

const TAXA = 0.10;
const CUPONS = { EXPO10: 0.10 };

/* ===== Estado ===== */
let carrinho = carregar();
let desconto = 0;      // percentual aplicado (ex.: 0.10)
let cupomAtivo = "";

/* ===== Atalhos ===== */
const $ = (id) => document.getElementById(id);
const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function carregar() {
  try { return JSON.parse(localStorage.getItem("carrinho-natanzinho")) || []; }
  catch (e) { return []; }
}
function salvar() {
  try { localStorage.setItem("carrinho-natanzinho", JSON.stringify(carrinho)); } catch (e) { /* ignora */ }
}

/* ===== Renderiza a lista de shows ===== */
function renderShows() {
  $("showsList").innerHTML = SHOWS.map((s) => `
    <article class="show">
      <div class="show-date"><span class="dia">${s.dia}</span><span class="mes">${s.mes}</span></div>
      <div class="show-info">
        <h3>${s.cidade}</h3>
        <p class="local">${s.local}</p>
        <div class="sectors">
          ${SETORES.map((st) => `
            <div class="sector">
              <div>
                <div class="sector-name">${st.nome}
                  ${s.esgotando === st.id ? '<span class="tag-esgotando">· últimos ingressos</span>' : ""}
                </div>
                <div class="sector-desc">${st.desc}</div>
              </div>
              <span class="sector-price">${moeda(st.preco)}</span>
              <button class="btn btn-ghost" data-show="${s.id}" data-setor="${st.id}">Adicionar</button>
            </div>`).join("")}
        </div>
      </div>
    </article>`).join("");
}

/* ===== Operações do carrinho ===== */
function chave(showId, setorId) { return showId + "-" + setorId; }

function adicionar(showId, setorId) {
  const k = chave(showId, setorId);
  const existente = carrinho.find((i) => i.key === k);
  if (existente) {
    if (existente.qtd >= 6) return aviso("Limite de 6 ingressos por setor.");
    existente.qtd++;
  } else {
    carrinho.push({ key: k, showId, setorId, qtd: 1 });
  }
  salvar(); renderCarrinho();
  aviso("Ingresso adicionado ao carrinho");
}

function alterarQtd(k, delta) {
  const item = carrinho.find((i) => i.key === k);
  if (!item) return;
  item.qtd += delta;
  if (item.qtd <= 0) carrinho = carrinho.filter((i) => i.key !== k);
  if (item.qtd > 6) item.qtd = 6;
  salvar(); renderCarrinho();
}

function remover(k) {
  carrinho = carrinho.filter((i) => i.key !== k);
  salvar(); renderCarrinho();
}

function calcular() {
  const subtotal = carrinho.reduce((soma, i) => {
    const st = SETORES.find((x) => x.id === i.setorId);
    return soma + st.preco * i.qtd;
  }, 0);
  const valorDesc = subtotal * desconto;
  const taxa = (subtotal - valorDesc) * TAXA;
  return { subtotal, valorDesc, taxa, total: subtotal - valorDesc + taxa };
}

function renderCarrinho() {
  const qtdTotal = carrinho.reduce((s, i) => s + i.qtd, 0);
  $("cartCount").textContent = qtdTotal;

  if (carrinho.length === 0) {
    $("cartItems").innerHTML = '<p class="empty">Seu carrinho está vazio.<br>Escolha um show e adicione ingressos.</p>';
    $("cartFoot").style.display = "none";
    return;
  }
  $("cartFoot").style.display = "block";

  $("cartItems").innerHTML = carrinho.map((i) => {
    const show = SHOWS.find((x) => x.id === i.showId);
    const st = SETORES.find((x) => x.id === i.setorId);
    return `
      <div class="item">
        <div>
          <div class="item-title">${st.nome}</div>
          <div class="item-sub">${show.cidade} · ${show.dia}/${show.mes}</div>
        </div>
        <div class="item-price">${moeda(st.preco * i.qtd)}</div>
        <div class="qty">
          <button data-acao="menos" data-key="${i.key}" aria-label="Diminuir">−</button>
          <span>${i.qtd}</span>
          <button data-acao="mais" data-key="${i.key}" aria-label="Aumentar">+</button>
        </div>
        <button class="remove" data-acao="remover" data-key="${i.key}">Remover</button>
      </div>`;
  }).join("");

  const c = calcular();
  $("subtotal").textContent = moeda(c.subtotal);
  $("discount").textContent = "− " + moeda(c.valorDesc);
  $("fee").textContent = moeda(c.taxa);
  $("total").textContent = moeda(c.total);
}

/* ===== Cupom ===== */
function aplicarCupom() {
  const codigo = $("couponInput").value.trim().toUpperCase();
  const msg = $("couponMsg");
  if (CUPONS[codigo]) {
    desconto = CUPONS[codigo]; cupomAtivo = codigo;
    msg.textContent = `Cupom ${codigo} aplicado: ${desconto * 100}% de desconto.`;
    msg.className = "coupon-msg ok";
  } else {
    desconto = 0; cupomAtivo = "";
    msg.textContent = "Cupom inválido. Confira o código e tente de novo.";
    msg.className = "coupon-msg err";
  }
  renderCarrinho();
}

/* ===== Abrir/fechar painéis ===== */
function abrirCarrinho() {
  $("drawer").classList.add("open");
  $("overlay").classList.add("open");
  $("drawer").setAttribute("aria-hidden", "false");
}
function fecharCarrinho() {
  $("drawer").classList.remove("open");
  $("overlay").classList.remove("open");
  $("drawer").setAttribute("aria-hidden", "true");
}
function abrirModal() {
  fecharCarrinho();
  $("checkoutForm").hidden = false;
  $("success").hidden = true;
  $("modal").classList.add("open");
  $("modal").setAttribute("aria-hidden", "false");
}
function fecharModal() {
  $("modal").classList.remove("open");
  $("modal").setAttribute("aria-hidden", "true");
}

/* ===== Validações ===== */
function cpfValido(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += cpf[i] * (t + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(cpf[t])) return false;
  }
  return true;
}

function finalizar(e) {
  e.preventDefault();
  const f = e.target;
  const erro = $("formError");
  f.querySelectorAll("input").forEach((i) => i.classList.remove("invalid"));

  const campos = [
    [f.nome, f.nome.value.trim().split(" ").length >= 2, "Informe nome e sobrenome."],
    [f.email, /^\S+@\S+\.\S+$/.test(f.email.value), "Informe um e-mail válido."],
    [f.cpf, cpfValido(f.cpf.value), "Informe um CPF válido."]
  ];
  for (const [campo, ok, mensagem] of campos) {
    if (!ok) {
      campo.classList.add("invalid"); campo.focus();
      erro.textContent = mensagem;
      return;
    }
  }
  erro.textContent = "";

  const codigo = "NL" + Math.random().toString(36).slice(2, 8).toUpperCase();
  $("orderCode").textContent = codigo;
  f.hidden = true;
  $("success").hidden = false;

  carrinho = []; desconto = 0; cupomAtivo = "";
  $("couponInput").value = ""; $("couponMsg").textContent = "";
  salvar(); renderCarrinho();
}

/* ===== Aviso rápido ===== */
let tempoAviso;
function aviso(texto) {
  const t = $("toast");
  t.textContent = texto;
  t.classList.add("show");
  clearTimeout(tempoAviso);
  tempoAviso = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ===== Eventos ===== */
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-show]");
  if (add) adicionar(add.dataset.show, add.dataset.setor);

  const acao = e.target.closest("[data-acao]");
  if (acao) {
    const k = acao.dataset.key;
    if (acao.dataset.acao === "mais") alterarQtd(k, 1);
    if (acao.dataset.acao === "menos") alterarQtd(k, -1);
    if (acao.dataset.acao === "remover") remover(k);
  }
});

$("openCart").addEventListener("click", abrirCarrinho);
$("closeCart").addEventListener("click", fecharCarrinho);
$("overlay").addEventListener("click", fecharCarrinho);
$("applyCoupon").addEventListener("click", aplicarCupom);
$("clearCart").addEventListener("click", () => { carrinho = []; salvar(); renderCarrinho(); });
$("checkoutBtn").addEventListener("click", abrirModal);
$("closeModal").addEventListener("click", fecharModal);
$("doneBtn").addEventListener("click", fecharModal);
$("checkoutForm").addEventListener("submit", finalizar);

// Máscara simples de CPF
$("checkoutForm").cpf.addEventListener("input", (e) => {
  let v = e.target.value.replace(/\D/g, "").slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  e.target.value = v;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { fecharCarrinho(); fecharModal(); }
});

/* ===== Início ===== */
renderShows();
renderCarrinho();
