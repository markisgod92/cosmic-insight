/*
25/07/2024

Crea una web app che utilizza le api della NASA:

- Richiedi la tua APIKEY qui - https://api.nasa.gov/
- Guarda e comprendi le api disponibili qui - https://api.nasa.gov/#browseAPI
- Nella tua web app deve esserci una sezione che mostra gli asteroidi che in questo momento 
    sono vicini alla terra (esiste un endpoint chiamato Asteroids - NeoWs)
- Nella tua web app deve esserci anche una sezione che mostra la "Astronomy Picture of the day" (esiste endpoint APOD)
- Nella tua web app metti anche una sezione che mostra le immagini del rover su marte (endpoint Mars Rover Photos)
- Sentiti libero di utilizzare altre api :)

Parti dell'app "MUST HAVE".

- Se un utente apre il sito per la PRIMA volta, dopo 10 secondi vedrà comparire un popup ANIMATO in basso a destra, 
    con un messaggio di benvenuto che si dismette AUTOMATICAMENTE dopo 4 secondi
- All'apertura del sito per la prima volta, l'utente dopo 2 secondi vedrà un banner (con fade in animation) 
    con una finta informativa sulla privacy che dovrà accettare tramite un pulsante. 
    Una volta accettato, non dovrà più comparire alle successive visite della pagina (dovrai leggere e scrivere dal localstorage suppongo)
- In una sezione apposita, visualizza le ultime 20 persone (random) che hanno visitato il sito, 
    prendendo i dati dall'endpoint 'https://dummyjson.com/users' sotto forma di mini avatar
*/

const API_KEY = `LcdKEcVj7T4glrTFvNyVrAQKnVQeFoXgEOEJv5HA`;

const loadingSpinner = document.getElementById("loading-spinner");
const loadingError = document.getElementById("loading-failed");
const sections = document.querySelectorAll("section");
const neoButtons = document.getElementById("neo-buttons");
const neoTHead = document.querySelector("#neo-table thead tr")
const neoTBody = document.querySelector("#neo-table tbody")
const astroPictureImg = document.getElementById("astro-picture");
const astroPictureData = document.getElementById("astro-picture-data");
const marsPictures = document.querySelector("#mars-pictures .carousel-inner");
const roverSelection = document.querySelectorAll("#rover-selection button");
const marsSwiper = document.getElementById("mars-swiper");
const swiper = new Swiper(`.swiper`, {
    direction: "horizontal",
    navigation: {
        prevEl: ".swiper-button-prev",
        nextEl: ".swiper-button-next"
    },
    centeredSlides: `auto`,
    effect: "coverflow"
});

const getTodayDate = () => {
    const today = new Date()

    let day = String(today.getDate()).padStart(2, 0);
    let month = String(today.getMonth() + 1).padStart(2, 0);
    let year = today.getFullYear();

    let currentDate = `${year}-${month}-${day}`;
    return currentDate;
};



// Asteroids - NeoWS
const neowsUrl = `https://api.nasa.gov/neo/rest/v1/feed`; //default END 7gg dopo START

const getNeowsData = async () => {
    let today = getTodayDate()

    try {
        const response = await fetch(`${neowsUrl}?start_date=${today}&api_key=${API_KEY}`);
        const data = await response.json();                                                  // TEST
        orderData(data.near_earth_objects); 
    } catch (error) {
        console.log("neows error", error);
    }
}

const orderData = (data) => {
    const order = Object.keys(data).sort((a, b) => new Date(a) - new Date(b));

    order.forEach((element, index) => {
        const button = document.createElement("button");
        button.setAttribute("class", "btn btn-secondary-outline neows-btn");
        button.innerText = element;
        neoButtons.appendChild(button);

        button.addEventListener("click", () => displayNeowsData(button, element, data))

        if (index === 0) {
            button.click();
        }
    })
}

const displayNeowsData = (currentBtn, key, data) => {
    neoTBody.replaceChildren();

    const buttons = document.querySelectorAll(".neows-btn");
    buttons.forEach(button => {
            button.classList.remove("active")
    })
    currentBtn.classList.add("active");

    data[key].forEach(item => {
        const tr = document.createElement("tr");
        tr.setAttribute("scope", "row")

        createNeoTD(item, tr)

        neoTBody.appendChild(tr)
    })
}

const createNeoTD = (item, container) => {
    const formatter = new Intl.NumberFormat("it-IT", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })

    const name = document.createElement("td");
    name.innerText = item.name;

    const magnitude = document.createElement("td");
    magnitude.innerText = item.absolute_magnitude_h;

    const closeApproach = document.createElement("td");
    closeApproach.innerText = item.close_approach_data[0].close_approach_date_full;

    const distance = document.createElement("td");
    distance.innerText = `${formatter.format(item.close_approach_data[0].miss_distance.kilometers)} km`;

    const speed = document.createElement("td");
    speed.innerText = `${formatter.format(item.close_approach_data[0].relative_velocity.kilometers_per_second)} km/s`;

    const diameter = document.createElement("td");
    diameter.innerText = `${formatter.format(item.estimated_diameter.meters.estimated_diameter_min)} m - ${formatter.format(item.estimated_diameter.meters.estimated_diameter_max)} m`;

    const hazard = document.createElement("td");
    if (item.is_potentially_hazardous_asteroid) {
        hazard.innerText = "Yes";
    } else {
        hazard.innerText = "No";
    }

    container.append(name, magnitude, closeApproach, distance, speed, diameter, hazard);
}



// Image of the Day
const imgUrl = `https://api.nasa.gov/planetary/apod`;

const getImg = async () => {
    try {
        const response = await fetch(`${imgUrl}?api_key=${API_KEY}`);
        const data = await response.json();
        displayImg(data);
    } catch (error) {
        console.log("img error", error)
    }
}

const displayImg = (data) => {
    astroPictureImg.src = data.hdurl;
    astroPictureImg.alt = data.title;

    const title = document.createElement("h5");
    title.innerText = data.title;

    const copyright = document.createElement("p");
    copyright.setAttribute("class", "fw-light fst-italic");
    copyright.innerText = data.copyright;

    const description = document.createElement("p");
    description.innerText = data.explanation;

    astroPictureData.append(title, copyright, description)
}



// Mars Rover
const marsUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/`

const getMarsData = async (rover = "perseverance") => {
    let today = getTodayDate();

    try {
        const response = await fetch(`${marsUrl}/${rover}/latest_photos?api_key=${API_KEY}`);
        const data = await response.json();
        displayMarsImg(data.latest_photos);
    } catch (error) {
        console.log("rover data error", error);
    }
}

const displayMarsImg = (data) => {
    data.forEach((item, index) => {
        const swiperSlide = document.createElement("div");
        swiperSlide.setAttribute("class", "swiper-slide d-flex flex-column justify-content-center align-items-center gap-3");

        const imgWrapper = document.createElement("div");
        imgWrapper.setAttribute("class", "w-50");

        const img = document.createElement("img");
        img.setAttribute("class", "w-100 object-fit-cover");
        img.src = item.img_src;
        img.alt = item.id;

        const caption = document.createElement("div");
        caption.setAttribute("class", "d-flex justify-content-center gap-3 text-light")

        const sol = document.createElement("p");
        sol.innerText = `Sol: ${item.sol}`;

        const date = document.createElement("p");
        date.innerText = `Earth date: ${item.earth_date}`;

        const camera = document.createElement("p");
        camera.innerText = `Camera: ${item.camera.name} - ${item.camera.full_name}`;

        imgWrapper.appendChild(img);
        caption.append(sol, date, camera);
        swiperSlide.append(imgWrapper, caption);
        marsSwiper.appendChild(swiperSlide);
    })
}

roverSelection.forEach(button => {
    button.addEventListener("click", () => {
        marsSwiper.replaceChildren();
        getMarsData(button.value);
    })
})


// LOADING
Promise.all([getNeowsData(), getMarsData(), getImg()])
    .then(() => {
        loadingSpinner.classList.add("d-none");
        sections.forEach(section => {
            section.classList.replace("d-none", "d-block");
        })
    })
    .catch((error) => {
        console.log(error);
        loadingSpinner.classList.add("d-none");
        loadingError.classList.replace("d-none", "d-flex");
    })