/* ===============================
   CONTROLE DE MODAIS
================================ */

const overlay = document.getElementById("overlay");

const modalProfissional = document.getElementById("modalProfissional");
const modalServico = document.getElementById("modalServico");
const modalCalendario = document.getElementById("modalCalendario");
const modalConfirmacao = document.getElementById("modalConfirmacao");

const btnAbrirAgendamento = document.getElementById("btnAbrirAgendamento");

function abrirModal(modal) {
  overlay.classList.remove("hidden");
  modal.classList.remove("hidden");
}

function fecharTodosModais() {
  overlay.classList.add("hidden");

  modalProfissional.classList.add("hidden");
  modalServico.classList.add("hidden");
  modalCalendario.classList.add("hidden");
  modalConfirmacao.classList.add("hidden");
}

overlay.onclick = fecharTodosModais;

/* ===============================
   ESTADOS DO AGENDAMENTO
================================ */

let profissionalSelecionado = null;
let servicoSelecionado = null;
let valorServico = null;
let dataSelecionada = null;
let horaSelecionada = null;

/* ===============================
   BOTÃO ABRIR AGENDAMENTO
================================ */

btnAbrirAgendamento.onclick = () => {
  abrirModal(modalProfissional);
};

/* ===============================
   ESCOLHA PROFISSIONAL
================================ */

document.querySelectorAll(".card-profissional").forEach(card => {
  card.onclick = () => {
    profissionalSelecionado = card.dataset.prof;

    modalProfissional.classList.add("hidden");
    abrirModal(modalServico);
  };
});

/* ===============================
   SERVIÇOS
================================ */

const servicos = [
  { nome: "Corte Degradê", valor: 25 },
  { nome: "Barba Completa", valor: 18 },
  { nome: "Corte Degradê + Barba", valor: 35 },
  { nome: "Corte Social", valor: 20 },
  { nome: "Corte Social + Barba", valor: 30 }
];

const listaServicos = document.querySelector(".lista-servicos");

function renderServicos() {
  listaServicos.innerHTML = "";

  servicos.forEach(servico => {
    const div = document.createElement("div");
    div.classList.add("servico-item");

    div.innerHTML = `
      <strong>${servico.nome}</strong>
      <p>R$ ${servico.valor}</p>
    `;

    div.onclick = () => {
      servicoSelecionado = servico.nome;
      valorServico = servico.valor;

      modalServico.classList.add("hidden");
      abrirModal(modalCalendario);
    };

    listaServicos.appendChild(div);
  });
}

renderServicos();

/* ===============================
   CALENDÁRIO DINÂMICO
================================ */

const calendarDays = document.getElementById("calendarDays");
const monthYear = document.getElementById("monthYear");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const horariosGrid = document.getElementById("horariosGrid");

let currentDate = new Date();

function renderCalendar() {
  calendarDays.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  monthYear.textContent = `${monthNames[month]} ${year}`;

  // Espaços antes do primeiro dia
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("span");
    calendarDays.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day++) {
    const span = document.createElement("span");
    span.textContent = day;

    const today = new Date();
    const dateCheck = new Date(year, month, day);

    // Bloquear dias passados
    if (dateCheck < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      span.classList.add("disabled");
    } else {
      span.onclick = () => {
        document.querySelectorAll(".calendar-days span").forEach(d => d.classList.remove("selected"));
        span.classList.add("selected");

        dataSelecionada = `${day}/${month+1}/${year}`;

        gerarHorarios();
      };
    }

    calendarDays.appendChild(span);
  }
}

prevMonthBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
};

nextMonthBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
};

renderCalendar();

/* ===============================
   HORÁRIOS DE 30 EM 30
================================ */

async function gerarHorarios() {
  horariosGrid.innerHTML = "";
  horaSelecionada = null;

  let inicio = 8;
  let fim = 20;

  // 🔥 Buscar horários já reservados

  
  const snapshot = await db.collection("agendamentos")
    .where("profissional", "==", profissionalSelecionado)
    .where("data", "==", dataSelecionada)
    .get();

  const horariosOcupados = snapshot.docs.map(doc => doc.data().hora);

  for (let h = inicio; h < fim; h++) {
    ["00", "30"].forEach(min => {
      const horaTexto = `${String(h).padStart(2,"0")}:${min}`;

      const btn = document.createElement("button");
      btn.classList.add("hora");
      btn.textContent = horaTexto;

      // 🔥 Se já estiver ocupado
      if (horariosOcupados.includes(horaTexto)) {
        btn.disabled = true;
        btn.style.opacity = "0.3";
        btn.style.cursor = "not-allowed";
      } else {
        btn.onclick = () => {
          document.querySelectorAll(".hora").forEach(b => b.classList.remove("selecionado"));
          btn.classList.add("selecionado");
          horaSelecionada = horaTexto;

          abrirModal(modalConfirmacao);
          mostrarResumo();
        };
      }

      horariosGrid.appendChild(btn);
    });
  }
}



/* ===============================
   RESUMO CONFIRMAÇÃO
================================ */

const resumoDiv = document.querySelector(".resumo");

function mostrarResumo() {
  resumoDiv.innerHTML = `
    <p><strong>Profissional:</strong> ${profissionalSelecionado}</p>
    <p><strong>Serviço:</strong> ${servicoSelecionado}</p>
    <p><strong>Data:</strong> ${dataSelecionada}</p>
    <p><strong>Horário:</strong> ${horaSelecionada}</p>
    <p><strong>Valor:</strong> R$ ${valorServico}</p>
  `;
}

/* ===============================
   CONFIRMAR AGENDAMENTO
================================ */

const btnConfirmar = document.getElementById("confirmarAgendamento");

btnConfirmar.onclick = async () => {
  const nome = document.getElementById("clienteNome").value;
  const telefone = document.getElementById("clienteTelefone").value;

  if (!nome || !telefone) {
    alert("Preencha todos os campos");
    return;
  }

  try {

    // 🔥 VERIFICAR SE O HORÁRIO AINDA ESTÁ DISPONÍVEL
    const snapshot = await db.collection("agendamentos")
      .where("profissional", "==", profissionalSelecionado)
      .where("data", "==", dataSelecionada)
      .where("hora", "==", horaSelecionada)
      .get();

    if (!snapshot.empty) {
      alert("Esse horário acabou de ser reservado 😢 Escolha outro.");
      fecharTodosModais();
      return;
    }

    // 🔥 SE ESTIVER LIVRE, SALVA
    await db.collection("agendamentos").add({
      profissional: profissionalSelecionado,
      servico: servicoSelecionado,
      valor: valorServico,
      data: dataSelecionada,
      hora: horaSelecionada,
      nome: nome,
      telefone: telefone,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Agendamento confirmado! 🎉");

    fecharTodosModais();

  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao salvar agendamento.");
  }
};


