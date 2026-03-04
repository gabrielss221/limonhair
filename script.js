const track = document.querySelector('.carousel-track');
const nextBtn = document.querySelector('.right-arrow');
const prevBtn = document.querySelector('.left-arrow');

let index = 0;

function updateCarousel() {
  const slideWidth = document.querySelector('.carousel-track img').offsetWidth + 25;
  track.style.transform = `translateX(-${index * slideWidth}px)`;
}

nextBtn.addEventListener('click', () => {
  if(index < track.children.length - 1){
    index++;
    updateCarousel();
  }
});

prevBtn.addEventListener('click', () => {
  if(index > 0){
    index--;
    updateCarousel();
  }
});

window.addEventListener('resize', updateCarousel);

function initReviews() {

  const service = new google.maps.places.PlacesService(document.createElement('div'));

  service.getDetails({
    placeId: 'ChIJF5q430PVvQARGfl8pg5eCxo',
    fields: ['reviews']
  }, function(place, status) {

    if (status === google.maps.places.PlacesServiceStatus.OK) {

      const container = document.getElementById('reviews-container');
      container.innerHTML = '';

      place.reviews.slice(0, 6).forEach(review => {

        const card = document.createElement('div');
        card.className = 'card-comentario';

        card.innerHTML = `
          <div class="stars">${'★'.repeat(review.rating)}</div>
          <p>"${review.text}"</p>
          <strong>${review.author_name}</strong>
        `;

        container.appendChild(card);
      });
    }
  });
}

window.onload = initReviews;

const slider = document.querySelector('.reviews-slider');

if(slider){
  let scrollAmount = 0;

  setInterval(() => {
    scrollAmount += 330;

    if(scrollAmount >= slider.scrollWidth - slider.clientWidth){
      scrollAmount = 0;
    }

    slider.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });

  }, 4000);
}





let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();

function gerarCalendario(){

  const calendario = document.getElementById("calendario");
  calendario.innerHTML = "";

  const hoje = new Date();
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();

  // ===== HEADER DO MÊS =====
  const header = document.createElement("div");
  header.classList.add("header-calendario");

  const btnPrev = document.createElement("button");
  btnPrev.innerText = "←";
  btnPrev.onclick = () => {
    mesAtual--;
    if(mesAtual < 0){
      mesAtual = 11;
      anoAtual--;
    }
    gerarCalendario();
  }

  const titulo = document.createElement("h3");
  titulo.innerText = new Date(anoAtual, mesAtual)
    .toLocaleString("pt-BR", { month: "long", year: "numeric" });

  const btnNext = document.createElement("button");
  btnNext.innerText = "→";
  btnNext.onclick = () => {
    mesAtual++;
    if(mesAtual > 11){
      mesAtual = 0;
      anoAtual++;
    }
    gerarCalendario();
  }

  header.appendChild(btnPrev);
  header.appendChild(titulo);
  header.appendChild(btnNext);

  calendario.appendChild(header);

  // ===== GRID DIAS =====
  const grid = document.createElement("div");
  grid.classList.add("grid-dias");

  for(let i=0; i<primeiroDia; i++){
    const vazio = document.createElement("div");
    grid.appendChild(vazio);
  }

  for(let i=1; i<=ultimoDia; i++){

    const dataAtual = new Date(anoAtual, mesAtual, i);
    const div = document.createElement("div");
    div.classList.add("dia");
    div.innerText = i;

    const hojeComparacao = new Date();
    hojeComparacao.setHours(0,0,0,0);

    if(dataAtual < hojeComparacao){
      div.classList.add("passado");
    }

    div.onclick = () => {
      document.querySelectorAll(".dia").forEach(d => d.classList.remove("selecionado"));
      div.classList.add("selecionado");
      gerarHorarios();
      mostrarEtapa(3);
    }

    grid.appendChild(div);
  }

  calendario.appendChild(grid);
}



async function gerarHorarios(){

  const container = document.getElementById("horarios");
  container.innerHTML = "";

  const diaSelecionado = document.querySelector(".dia.selecionado")?.innerText;

  const snapshot = await getDocs(collection(db, "agendamentos"));

  let horariosOcupados = [];

  snapshot.forEach(doc => {
    const dados = doc.data();
    if(
      dados.data == diaSelecionado &&
      dados.mes == mesAtual &&
      dados.ano == anoAtual
    ){
      horariosOcupados.push(dados.horario);
    }
  });

  const horariosDisponiveis = [
    "09:00","10:00","11:00",
    "14:00","15:00","16:00"
  ];

  horariosDisponiveis.forEach(h => {

    const btn = document.createElement("button");
    btn.innerText = h;

    if(horariosOcupados.includes(h)){
      btn.disabled = true;
      btn.style.opacity = "0.3";
      btn.innerText += " (Ocupado)";
    }else{
      btn.onclick = () => {
        horarioSelecionado = h;
        mostrarEtapa(4);
      }
    }

    container.appendChild(btn);
  });
}



function fecharModal(){
  document.getElementById("modalAgendamento").style.display = "none";
}


