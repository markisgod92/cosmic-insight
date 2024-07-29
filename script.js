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

// DOM Elements
const loadingSpinner = document.getElementById("loading-spinner");
const loadingError = document.getElementById("loading-failed");
const roverHightlight = document.getElementById("roverHighlight");
const sections = document.querySelectorAll("section");
const neoButtons = document.getElementById("neo-buttons");
const neoTHead = document.querySelector("#neo-table thead tr")
const neoTBody = document.querySelector("#neo-table tbody")
const astroPictureImg = document.getElementById("astro-picture");
const astroPictureData = document.getElementById("astro-picture-data");
const marsPictures = document.getElementById("mars-pictures");
const roverSelection = document.querySelectorAll("#rover-selection button");
const loadMoreBtn = document.getElementById("loadMoreRover");
const svg = d3.select("#asteroidMap")
const tooltip = d3.select("#tooltip");
const formatter = new Intl.NumberFormat("it-IT", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})


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
    createNeoHighlight(order, data)
    createDateButtons(order, data);
}

const getSingleNeoData = (data) => {
    return object = {
        name: data.name,
        magnitude: data.absolute_magnitude_h,
        closeApproach: data.close_approach_data[0].close_approach_date_full,
        distance: data.close_approach_data[0].miss_distance.kilometers,
        speed: data.close_approach_data[0].relative_velocity.kilometers_per_second,
        minDiameter: data.estimated_diameter.meters.estimated_diameter_min,
        maxDiameter: data.estimated_diameter.meters.estimated_diameter_max,
        hazard: data.is_potentially_hazardous_asteroid ? "Yes" : "No"
    }
}

const createNeoHighlight = (orderedData, data) => {
    const randomDayData = data[orderedData[Math.floor(Math.random() * orderedData.length)]]
    const object = getSingleNeoData(randomDayData[Math.floor(Math.random() * randomDayData.length)])

    document.querySelector("#neoHighlight h6").innerText = object.name;

    document.querySelector("#neoHighlight p:first-of-type").innerText = `Close Approach Date: ${object.closeApproach}`;

    document.querySelector("#neoHighlight p:nth-of-type(2)").innerText = `Distance: ${formatter.format(object.distance)} km`;

    document.querySelector("#neoHighlight p:nth-of-type(3)").innerText = `Speed: ${formatter.format(object.speed)} km/s`;

    document.querySelector("#neoHighlight p:last-of-type").innerText = `Diameter: ${formatter.format(object.minDiameter)} m - ${formatter.format(object.maxDiameter)} m`;
}

const createDateButtons = (orderedData, data) => {
    orderedData.forEach((element, index) => {
        const button = document.createElement("button");
        button.setAttribute("class", "btn btn-secondary-outline text-light neows-btn");
        button.innerText = element;
        neoButtons.appendChild(button);

        button.addEventListener("click", () => displayNeowsData(button, element, data))

        if (index === 0) {
            button.click();
        }
    })
}

const drawNeo = (data) => {
    svg.selectAll("*").remove();

    const asteroidData = Object.values(data).flat().map(getSingleNeoData);

    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(asteroidData, d => d.maxDiameter)])
        .range([2, 20]);

    const angleScale = d3.scaleLinear()
        .domain([0, asteroidData.length])
        .range([0, 2 * Math.PI]);

    const distanceScale = d3.scaleLog()
        .domain([d3.min(asteroidData, d => d.distance), d3.max(asteroidData, d => d.distance)])
        .range([50, 400]);

    svg.selectAll("circle")
        .data(asteroidData)
        .enter()
        .append("circle")
        .attr("cx", d => distanceScale(d.distance) * Math.cos(angleScale(asteroidData.indexOf(d))))
        .attr("cy", d => distanceScale(d.distance) * Math.sin(angleScale(asteroidData.indexOf(d))))
        .attr("r", d => sizeScale(d.maxDiameter))
        .attr("fill", "orange")
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`Name: ${d.name}<br>Diameter: ${formatter.format(d.maxDiameter)} m<br>Distance: ${formatter.format(d.distance)} km`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });

    svg.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("fill", "blue");

    svg.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("Earth");
}

const displayNeowsData = (currentBtn, key, data) => {
    neoTBody.replaceChildren();

    drawNeo(data[key]);

    const buttons = document.querySelectorAll(".neows-btn");
    buttons.forEach(button => {
            button.classList.remove("active")
    })
    currentBtn.classList.add("active");

    data[key].forEach(item => {
        const tr = document.createElement("tr");
        tr.setAttribute("scope", "row")

        const objectData = getSingleNeoData(item)
        createNeoTD(objectData, tr)

        neoTBody.appendChild(tr)
    })
}

const createNeoTD = (item, container) => {
    const name = document.createElement("td");
    name.innerText = item.name;

    const magnitude = document.createElement("td");
    magnitude.innerText = item.magnitude;

    const closeApproach = document.createElement("td");
    closeApproach.innerText = item.closeApproach;

    const distance = document.createElement("td");
    distance.innerText = `${formatter.format(item.distance)} km`;

    const speed = document.createElement("td");
    speed.innerText = `${formatter.format(item.speed)} km/s`;

    const diameter = document.createElement("td");
    diameter.innerText = `${formatter.format(item.minDiameter)} m - ${formatter.format(item.maxDiameter)} m`;

    const hazard = document.createElement("td");
    hazard.innerText = item.hazard;

    container.append(name, magnitude, closeApproach, distance, speed, diameter, hazard);
}



// Image of the Day
const imgUrl = `https://api.nasa.gov/planetary/apod?thumbs=true`;

const getImg = async () => {
    try {
        const response = await fetch(`${imgUrl}&api_key=${API_KEY}`);
        const data = await response.json();
        displayApodHighlight(data);
        displayImg(data);
    } catch (error) {
        console.log("img error", error)
    }
}

const displayApodHighlight = (data) => {
    if (data.media_type === "image") {
        document.querySelector("#apodHighlight img").src = data.hdurl;
    } else if (data.media_type === "video") {
        document.querySelector("#apodHighlight img").src = data.thumbnail_url;
    }
    document.querySelector("#apodHighlight img").alt = data.title;
    
    document.querySelector("#apodHighlight p").innerText = data.title;
}

const displayImg = (data) => {
    if (data.media_type === "image") {
        astroPictureImg.src = data.hdurl;
    } else if (data.media_type === "video") {
        astroPictureImg.src = data.thumbnail_url;
    }
    astroPictureImg.alt = data.title;

    const title = document.createElement("h5");
    title.innerText = data.title;

    const copyright = document.createElement("p");
    copyright.setAttribute("class", "fw-light fst-italic");
    copyright.innerText = data.copyright;

    const description = document.createElement("p");
    description.innerText = data.explanation;

    astroPictureData.append(title, copyright, description)

    astroPictureImg.addEventListener("click", () => displayApodModal(data))
}

const displayApodModal = (data) => {
    const modal = new bootstrap.Modal(document.getElementById('picModal'));

    if (data.media_type === "image") {
        document.querySelector("#picModal img").src = data.hdurl;
    } else if (data.media_type === "video") {
        document.querySelector("#picModal img").src = data.thumbnail_url;
    }
    document.querySelector("#picModal img").alt = data.title;

    const title = document.createElement("p");
    title.innerText = data.title;

    const copyright = document.createElement("p");
    copyright.innerText = data.copyright;

    document.querySelector("#picModal .modal-footer").replaceChildren();
    document.querySelector("#picModal .modal-footer").append(title, copyright);

    modal.show();
}


// Mars Rover
const marsUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/`
const itemsPerPage = 12;
let currentPage = 0;
let currentRoverData = [];

const getMarsData = async (rover = "perseverance") => {
    try {
        const response = await fetch(`${marsUrl}/${rover}/latest_photos?api_key=${API_KEY}`);
        const data = await response.json();
        displayRoverHighlight(data.latest_photos);
        currentRoverData = data.latest_photos;
        currentPage = 0;
        displayMarsImg();
    } catch (error) {
        console.log("rover data error", error);
    }
}

const displayRoverHighlight = (data) => {
    const randomImg = data[Math.floor(Math.random() * data.length)]
    roverHightlight.src = randomImg.img_src;
    roverHightlight.alt = randomImg.id;
}

const displayMarsImg = () => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    const toLoad = currentRoverData.slice(start, end);

    toLoad.forEach(item => {
        const col = document.createElement("div");
        col.setAttribute("class", "col");

        const card = document.createElement("div");
        card.setAttribute("class", "card h-100 mars-card border-0");

        const img = document.createElement("img");
        img.setAttribute("class", "h-100 object-fit-cover");
        img.src = item.img_src;
        img.alt = item.id;

        card.appendChild(img);
        col.appendChild(card);
        marsPictures.appendChild(col);

        card.addEventListener("click", () => displayMarsModal(item))
    })

    currentPage++;

    if (currentPage * itemsPerPage < currentRoverData.length) {
        loadMoreBtn.classList.add("d-block")
        loadMoreBtn.classList.remove("d-none")
    } else {
        loadMoreBtn.classList.remove("d-block")
        loadMoreBtn.classList.add("d-none")
    }
}

loadMoreBtn.addEventListener("click", displayMarsImg)

roverSelection.forEach(button => {
    button.addEventListener("click", () => {
        roverSelection.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        marsPictures.replaceChildren();
        getMarsData(button.value);
    })
})

const displayMarsModal = (data) => {
    const modal = new bootstrap.Modal(document.getElementById('picModal'));

    document.querySelector("#picModal img").src = data.img_src;
    document.querySelector("#picModal img").alt = data.id;

    const sol = document.createElement("p");
    sol.innerText = `Sol: ${data.sol}`;

    const date = document.createElement("p");
    date.innerText = `Earth date: ${data.earth_date}`;

    const camera = document.createElement("p");
    camera.innerText = `Camera: ${data.camera.name} - ${data.camera.full_name}`;

    document.querySelector("#picModal .modal-footer").replaceChildren();
    document.querySelector("#picModal .modal-footer").append(sol, date, camera);

    modal.show();
}


// users
const getUsersData = async () => {
    try {
        const response = await fetch(`https://dummyjson.com/users`);
        const data = await response.json();
        // random number of users
        const users = data.users.slice(0, Math.floor(Math.random() * data.users.length))
        users.forEach(user => displayUser(user));

        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    } catch (error) {
        console.log(error)
    }
}
getUsersData()

const displayUser = (data) => {
    const anchor = document.createElement("a");
    anchor.setAttribute("href", "#")
    anchor.setAttribute("data-bs-toggle", "tooltip");
    anchor.setAttribute("data-bs-title", data.username);

    const img = document.createElement("img");
    img.setAttribute("class", "fakeUserImg rounded-circle");
    
    img.src = data.image;
    img.alt = data.username;

    anchor.appendChild(img)
    document.getElementById("usersOnline").append(anchor);
}

const assignUsername = () => {
    const userName = window.localStorage.getItem("username");
    document.getElementById("usernameData").innerText = userName;
}   

assignUsername();

// LOADING
Promise.all([getNeowsData(), getMarsData(), getImg()])
    .then(() => {
        loadingSpinner.classList.add("d-none");
        sections.forEach(section => {
            section.classList.replace("d-none", "d-block");
        })
        document.querySelector("aside").classList.remove("d-none")
    })
    .catch((error) => {
        console.log(error);
        loadingSpinner.classList.add("d-none");
        loadingError.classList.replace("d-none", "d-flex");
    })