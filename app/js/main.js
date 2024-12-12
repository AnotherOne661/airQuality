const API = "";

let clickCoor = "";
let clickContaminantes;

async function onMapClick(e) {
  const latLong = e.latlng.toString();
  let latLong_arr = latLong.split(", ");

  console.log(latLong_arr);

  const latitude = parseFloat(latLong_arr[0].replace("LatLng(", ""));
  const longitude = parseFloat(latLong_arr[1].replace(")", ""));
  console.log("Latitude: " + latitude + ", Longitude: " + longitude);

  clickContaminantes = await obtenerComponentes(latitude, longitude);
  let formattedContaminantes = JSON.stringify(clickContaminantes, null, 2);
  Swal.fire({
    title: "Las coordenadas seleccionadas poseeen:",
    icon: "info",
    text: formattedContaminantes,
    iconColor: "#d9fc18",
    color: "#d9fc18",
    background: "#0e8114",
  });
  /*const myPopup = new Popup({
    id: "my-popup",
    title: `Se ha clickado en Latitud: ` + latitude + " Longitud: " + longitude,
    content:
      ` Se han encontrado los siguientes datos
        ` + formattedContaminantes,
    fadeTime: `0.3s`,
    backgroundColor: `#77DD77`,
    titleColor: `#ffffff`,
    textColor: `#ffee8c`,
    closeColor: `#ffffff`,
    widthMultiplier: `0.5`,
    heightMultiplier: `0.2`,
  });

  myPopup.show();*/
}

async function obtenerComponentes(lat, lng) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${API}`
    );
    const data = await response.json();
    console.log(data);
    return data.list[0].components;
  } catch (error) {
    console.error("Error fetching air quality data:", error);
    return [];
  }
}

async function displayDataTable() {
  $(document).ready(function () {
    $("#myTable").DataTable();
  });
}

const tbody = document.querySelector("#myTbody");

function addRow(institute, component, value, unit, date) {
  const tableRow = document.createElement("tr");
  tableRow.innerHTML = `
    <td>${institute}</td>
    <td>${component.toUpperCase()}</td>
    <td>${value}</td>
    <td>${unit}</td>
    <td>${date}</td>
  `;
  tbody.appendChild(tableRow);
}

function processAirQualityData(data, institute) {
  const components = data.list[0].components;
  const date = new Date(data.list[0].dt * 1000).toLocaleString();

  for (const [component, value] of Object.entries(components)) {
    addRow(institute, component, value, "µg/m³", date);
  }
}

async function main() {
  const map = L.map("map").setView([40.573942, -4.005455], 13);
  let lanLong;

  map.on("click", onMapClick);
  const popup = L.popup();

  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const satellite = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  );

  const topography = L.tileLayer(
    "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    {
      attribution:
        'Map data: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors',
    }
  );

  const esriSatellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    }
  );

  const darkTheme = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://carto.com/attributions">CartoDB</a> contributors',
    }
  );

  satellite.addTo(map);

  const baseMaps = {
    "Satellite View": satellite,
    Topography: topography,
    "Esri Satellite": esriSatellite,
    "Dark Theme": darkTheme,
  };

  const defaultView = {
    center: [40.573942, -4.005455],
    zoom: 10,
  };

  const resetViewButton = L.control({ position: "bottomleft" });

  resetViewButton.onAdd = function () {
    const button = L.DomUtil.create("button", "reset-view-btn");
    button.innerHTML = "Reset View";
    button.style.backgroundColor = "white";
    button.style.border = "2px solid gray";
    button.style.borderRadius = "5px";
    button.style.padding = "5px 10px";
    button.style.cursor = "pointer";
    button.onclick = function () {
      map.setView(defaultView.center, defaultView.zoom);
    };
    return button;
  };

  resetViewButton.addTo(map);

  L.control.layers(baseMaps).addTo(map);

  const markers = [
    { coords: [40.582884, -4.011464], name: "IES Infanta Elena" },
    { coords: [40.378052, -3.656922], name: "IES Madrid Sur" },
    { coords: [40.444775, -3.719944], name: "IES San Isidoro de Sevilla" },
    { coords: [40.352739, -3.696325], name: "IES Ciudad de Los Ángeles" },
    { coords: [40.439698, -3.65676], name: "IES Salvador Dalí" },
  ];

  markers.forEach((marker) => {
    const leafletMarker = L.marker(marker.coords).addTo(map);
    leafletMarker.bindPopup(marker.name);
  });

  for (const marker of markers) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${marker.coords[0]}&lon=${marker.coords[1]}&appid=${API}`
      );
      const data = await response.json();
      processAirQualityData(data, marker.name);
    } catch (error) {
      console.error(`Error fetching data for ${marker.name}:`, error);
    }
  }
  $(document).ready(() => {
    $("#myTable").DataTable();
  });
}

main();
