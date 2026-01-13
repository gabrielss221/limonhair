/* ===============================
   FIREBASE JÁ INICIALIZADO NO HTML
   =============================== */

const calendarDays = document.getElementById("calendarDays");
const monthYear = document.getElementById("monthYear");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const horariosBox = document.getElementById("horarios");
const horariosGrid = document.querySelector(".horarios-grid");
const btnAgendar = document.getElementById("agendar");

let dataSelecionada = null;
let horaSelecionada = null;

const horariosFixos = [
  "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00",
  "16:00", "17:00"
];

let dataAtual = new Date();

/* ===============================
   CALENDÁRIO
   =============================== */

function renderCalendar() {
  calendarDays.innerHTML = "";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  monthYear.textContent = dataAtual.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i++) {
    calendarDays.innerHTML += `<span class="disabled"></span>`;
  }

  for (let dia = 1; dia <= totalDias; dia++) {
    const span = document.createElement("span");
    span.textContent = dia;

    const dataCompleta = new Date(ano, mes, dia);
    dataCompleta.setHours(0, 0, 0, 0);

    const dataISO = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    // 🔒 BLOQUEAR DIAS PASSADOS
    if (dataCompleta < hoje) {
      span.classList.add("disabled");
    } else {
      span.onclick = () => selecionarData(span, dataISO);
    }

    calendarDays.appendChild(span);
  }
}

/* ===============================
   SELEÇÃO DE DATA
   =============================== */

async function selecionarData(elemento, data) {
  document.querySelectorAll(".calendar-days span")
    .forEach(d => d.classList.remove("selected"));

  elemento.classList.add("selected");
  dataSelecionada = data;
  horaSelecionada = null;
  btnAgendar.disabled = true;

  horariosBox.classList.remove("hidden");
  await carregarHorarios();
}

/* ===============================
   HORÁRIOS + BLOQUEIO
   =============================== */

async function carregarHorarios() {
  horariosGrid.innerHTML = "";

  const snapshot = await db
    .collection("agendamentos")
    .where("data", "==", dataSelecionada)
    .get();

  const horariosOcupados = snapshot.docs.map(doc => doc.data().hora);

  horariosFixos.forEach(hora => {
    const btn = document.createElement("button");
    btn.textContent = hora;
    btn.classList.add("hora");

    if (horariosOcupados.includes(hora)) {
      btn.disabled = true;
      btn.style.opacity = "0.4";
      btn.style.cursor = "not-allowed";
    } else {
      btn.onclick = () => selecionarHorario(btn, hora);
    }

    horariosGrid.appendChild(btn);
  });
}

function selecionarHorario(botao, hora) {
  document.querySelectorAll(".hora")
    .forEach(h => h.classList.remove("selecionado"));

  botao.classList.add("selecionado");
  horaSelecionada = hora;
  btnAgendar.disabled = false;
}

/* ===============================
   SALVAR AGENDAMENTO
   =============================== */

btnAgendar.onclick = async () => {
  if (!dataSelecionada || !horaSelecionada) return;

  try {
    await db.collection("agendamentos").add({
      data: dataSelecionada,
      hora: horaSelecionada,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    const mensagem = encodeURIComponent(
      `Olá! Gostaria de confirmar meu horário 💇‍♀️✨\n\n📅 Data: ${formatarData(dataSelecionada)}\n⏰ Hora: ${horaSelecionada}`
    );

    window.open(`https://wa.me/5522981467008?text=${mensagem}`, "_blank");

    alert("Horário agendado com sucesso!");
    location.reload();

  } catch (e) {
    console.error("Erro ao salvar:", e);
    alert("Erro ao salvar o agendamento.");
  }
};

/* ===============================
   UTIL
   =============================== */

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

/* ===============================
   INICIAR
   =============================== */

renderCalendar();
