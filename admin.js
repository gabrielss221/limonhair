// =============================
// FIREBASE
// =============================
const db = firebase.firestore();
const auth = firebase.auth();

// =============================
// ELEMENTOS
// =============================
const listaDiv = document.getElementById("listaAgendamentos");
const faturamentoMesSpan = document.getElementById("faturamentoMes");
const totalAgendamentosSpan = document.getElementById("totalAgendamentos");
const filtroMes = document.getElementById("filtroMes");

let graficoProfissionais;
let graficoServicos;
let unsubscribeSnapshot; // evita múltiplos listeners

// =============================
// DEFINIR MÊS ATUAL
// =============================
const hoje = new Date();
filtroMes.value = `${hoje.getFullYear()}-${String(
  hoje.getMonth() + 1
).padStart(2, "0")}`;

// =============================
// TROCAR SEÇÃO (AGORA GLOBAL REAL)
// =============================
window.mostrarSecao = function (id) {
  document.querySelectorAll(".secao").forEach(sec => {
    sec.classList.add("hidden");
  });

  const secao = document.getElementById(id);
  if (secao) {
    secao.classList.remove("hidden");
  }
};

// =============================
// CARREGAR DADOS
// =============================
function carregarDados() {

  if (unsubscribeSnapshot) {
    unsubscribeSnapshot(); // remove listener anterior
  }

  const [anoFiltro, mesFiltro] = filtroMes.value.split("-");
  const mes = Number(mesFiltro) - 1;
  const ano = Number(anoFiltro);

  unsubscribeSnapshot = db.collection("agendamentos")
    .orderBy("criadoEm", "desc")
    .onSnapshot((snapshot) => {

      listaDiv.innerHTML = "";

      let faturamentoMes = 0;
      let totalAgendamentos = 0;

      let faturamentoPorProfissional = {};
      let servicosContagem = {};

      snapshot.forEach((doc) => {
        const ag = doc.data();
        const id = doc.id;

        if (!ag.criadoEm) return;

        const data = ag.criadoEm.toDate();

        if (data.getMonth() === mes && data.getFullYear() === ano) {

          faturamentoMes += Number(ag.valor);
          totalAgendamentos++;

          // PROFISSIONAL
          if (!faturamentoPorProfissional[ag.profissional]) {
            faturamentoPorProfissional[ag.profissional] = 0;
          }
          faturamentoPorProfissional[ag.profissional] += Number(ag.valor);

          // SERVIÇO
          if (!servicosContagem[ag.servico]) {
            servicosContagem[ag.servico] = 0;
          }
          servicosContagem[ag.servico]++;

          // CARD
          const div = document.createElement("div");
          div.classList.add("agendamento-card");

          div.innerHTML = `
            <div class="agendamento-topo">
              <strong>${ag.nome}</strong>
              <span class="valor">R$ ${Number(ag.valor).toFixed(2)}</span>
            </div>

            <div>
              <p><b>Profissional:</b> ${ag.profissional}</p>
              <p><b>Serviço:</b> ${ag.servico}</p>
              <p><b>Data:</b> ${ag.data} às ${ag.hora}</p>
            </div>

            <button class="btn-cancelar" onclick="cancelarAgendamento('${id}')">
              Cancelar
            </button>
          `;

          listaDiv.appendChild(div);
        }
      });

      faturamentoMesSpan.textContent = "R$ " + faturamentoMes.toFixed(2);
      totalAgendamentosSpan.textContent = totalAgendamentos;

      atualizarGraficos(faturamentoPorProfissional, servicosContagem);
    });
}

// =============================
// GRÁFICOS
// =============================
function atualizarGraficos(profissionais, servicos) {

  const ctx1 = document.getElementById("graficoProfissionais").getContext("2d");
  const ctx2 = document.getElementById("graficoServicos").getContext("2d");

  if (graficoProfissionais) graficoProfissionais.destroy();
  if (graficoServicos) graficoServicos.destroy();

  graficoProfissionais = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: Object.keys(profissionais),
      datasets: [{
        data: Object.values(profissionais),
        backgroundColor: "#9aff3d",
        borderRadius: 8
      }]
    },
    options: {
      plugins: { legend: { display: false } }
    }
  });

  graficoServicos = new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: Object.keys(servicos),
      datasets: [{
        data: Object.values(servicos),
        backgroundColor: ["#9aff3d","#333","#555","#777","#999"]
      }]
    }
  });
}

// =============================
// CANCELAR
// =============================
window.cancelarAgendamento = async function (id) {
  const confirmar = confirm("Tem certeza que deseja cancelar?");
  if (!confirmar) return;

  await db.collection("agendamentos").doc(id).delete();
};

// =============================
// LOGIN ADMIN
// =============================
auth.onAuthStateChanged((user) => {
  if (user) {

    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("painelContainer").style.display = "flex";

    mostrarSecao("dashboard"); // 🔥 garante que abre dashboard
    carregarDados();

  } else {

    document.getElementById("loginContainer").style.display = "block";
    document.getElementById("painelContainer").style.display = "none";
  }
});

window.loginAdmin = function () {
  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;

  auth.signInWithEmailAndPassword(email, senha)
    .catch(error => {
      document.getElementById("erroLogin").textContent = error.message;
    });
};

window.logoutAdmin = function () {
  auth.signOut();
};

// =============================
// FILTRO MÊS
// =============================
filtroMes.addEventListener("change", carregarDados);
