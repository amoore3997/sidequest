const sidequests = window.SIDEQUESTS;

if (!Array.isArray(sidequests)) {
  throw new Error(
    "SideQuest location data could not be loaded."
  );
}

    const OTTAWA = {
      lat: 45.4215,
      lng: -75.6972
    };
    
    const map = L.map("map", {
      zoomControl: false,
      minZoom: 6
    }).setView(
      [OTTAWA.lat, OTTAWA.lng],
      9
    );

    L.control
      .zoom({
        position: "topright"
      })
      .addTo(map);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    ).addTo(map);

    const markerLayer = L.layerGroup().addTo(map);

    let searchCenter = {
      ...OTTAWA
    };

    let activeCategory = "all";
    let activeQuestId = null;
    let selectedReportType = "";
    let userMarker = null;

    const radiusInput =
      document.getElementById("radiusInput");

    const radiusValue =
      document.getElementById("radiusValue");

    const resultCount =
      document.getElementById("resultCount");

    const questList =
      document.getElementById("questList");

    const searchInput =
      document.getElementById("searchInput");

    const modalBackdrop =
      document.getElementById("modalBackdrop");

    const reportForm =
      document.getElementById("reportForm");

    const toast =
      document.getElementById("toast");

    const radiusCircle = L.circle(
      [searchCenter.lat, searchCenter.lng],
      {
        radius: Number(radiusInput.value) * 1000,
        color: "#76c982",
        weight: 1,
        opacity: 0.7,
        fillColor: "#76c982",
        fillOpacity: 0.06,
        dashArray: "7 8"
      }
    ).addTo(map);

    function haversineDistance(a, b) {
      const earthRadiusKm = 6371;

      const toRadians = value =>
        (value * Math.PI) / 180;

      const latitudeDifference =
        toRadians(b.lat - a.lat);

      const longitudeDifference =
        toRadians(b.lng - a.lng);

      const latitudeOne =
        toRadians(a.lat);

      const latitudeTwo =
        toRadians(b.lat);

      const value =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(latitudeOne) *
          Math.cos(latitudeTwo) *
          Math.sin(longitudeDifference / 2) ** 2;

      return (
        earthRadiusKm *
        2 *
        Math.atan2(
          Math.sqrt(value),
          Math.sqrt(1 - value)
        )
      );
    }

    function createQuestIcon(quest) {
      return L.divIcon({
        className: "",
        html:
          `<div class="map-pin">` +
          `<span>${quest.icon}</span>` +
          `</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -36]
      });
    }

    function matchesSearch(quest, searchTerm) {
      if (!searchTerm) {
        return true;
      }

      const searchableText = [
        quest.name,
        quest.category,
        ...quest.tags
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    }

    function getFilteredQuests() {
      const radiusKm =
        Number(radiusInput.value);

      const searchTerm =
        searchInput.value.trim().toLowerCase();

      return sidequests
        .map(quest => ({
          ...quest,
          distanceKm: haversineDistance(
            searchCenter,
            quest
          )
        }))
        .filter(
          quest =>
            quest.distanceKm <= radiusKm
        )
        .filter(
          quest =>
            activeCategory === "all" ||
            quest.category === activeCategory
        )
        .filter(
          quest =>
            matchesSearch(quest, searchTerm)
        )
        .sort(
          (first, second) =>
            first.distanceKm - second.distanceKm
        );
    }

    function openQuest(questId) {
      const quest =
        sidequests.find(
          item => item.id === questId
        );

      if (!quest) {
        return;
      }

      const distanceKm =
        haversineDistance(
          searchCenter,
          quest
        );

      activeQuestId = questId;
      selectedReportType = "";

      reportForm.classList.remove("open");

      document
        .querySelectorAll(".report-option")
        .forEach(option =>
          option.classList.remove("selected")
        );

      document.getElementById(
        "reportNote"
      ).value = "";

      document.getElementById(
        "modalEyebrow"
      ).textContent = quest.category;

      document.getElementById(
        "modalTitle"
      ).textContent = quest.name;

      document.getElementById(
        "modalDescription"
      ).textContent = quest.description;

      document.getElementById(
        "modalDistance"
      ).textContent =
        `${distanceKm.toFixed(1)} km away`;

      document.getElementById(
        "modalAccess"
      ).textContent =
        `${quest.price} · ${quest.access}`;

      document.getElementById(
        "modalDifficulty"
      ).textContent = quest.difficulty;

      document.getElementById(
        "modalBestFor"
      ).textContent = quest.bestFor;

      document.getElementById(
        "modalRules"
      ).textContent = quest.rules;

      document.getElementById(
        "modalReportTitle"
      ).textContent = quest.reportTitle;

      document.getElementById(
        "modalReportText"
      ).textContent = quest.reportText;

      modalBackdrop.classList.add("open");
    }

    function closeModal() {
      modalBackdrop.classList.remove("open");
      reportForm.classList.remove("open");
    }

    function renderQuests() {
      const filteredQuests =
        getFilteredQuests();

      markerLayer.clearLayers();
      questList.innerHTML = "";

      const resultLabel =
        filteredQuests.length === 1
          ? "SideQuest"
          : "SideQuests";

      resultCount.textContent =
        `${filteredQuests.length} ${resultLabel} found`;

      if (filteredQuests.length === 0) {
        questList.innerHTML = `
          <div class="empty-state">
            No demo SideQuests match these filters.
            Try a wider radius or another activity.
          </div>
        `;

        return;
      }

      filteredQuests.forEach(quest => {
        const marker = L.marker(
          [quest.lat, quest.lng],
          {
            icon: createQuestIcon(quest),
            title: quest.name
          }
        );

        marker.bindPopup(`
          <div class="popup-card">
            <small>${quest.category}</small>
            <h3>${quest.name}</h3>
            <p>
              ${quest.distanceKm.toFixed(1)} km away
              · ${quest.price}
            </p>
            <button
              type="button"
              onclick="openQuest(${quest.id})"
            >
              View SideQuest
            </button>
          </div>
        `);

        marker.addTo(markerLayer);

        const card =
          document.createElement("button");

        card.type = "button";

        card.className =
          `quest-card${
            activeQuestId === quest.id
              ? " active"
              : ""
          }`;

        card.innerHTML = `
          <span class="quest-icon">
            ${quest.icon}
          </span>

          <span>
            <h3>${quest.name}</h3>

            <p class="quest-meta">
              ${quest.distanceKm.toFixed(1)} km
              · ${quest.bestFor}
              · ${quest.difficulty}
            </p>
          </span>

          <span class="quest-price">
            ${quest.price}
          </span>
        `;

        card.addEventListener(
          "click",
          () => {
            activeQuestId = quest.id;

            map.flyTo(
              [quest.lat, quest.lng],
              12,
              {
                duration: 0.8
              }
            );

            marker.openPopup();
            renderQuests();
          }
        );

        questList.appendChild(card);
      });
    }

    function updateRadius() {
      radiusValue.textContent =
        `${radiusInput.value} km`;

      radiusCircle.setRadius(
        Number(radiusInput.value) * 1000
      );

      renderQuests();
    }

    function setSearchCenter(
      latitude,
      longitude,
      displayMarker = true
    ) {
      searchCenter = {
        lat: latitude,
        lng: longitude
      };

      radiusCircle.setLatLng([
        latitude,
        longitude
      ]);

      if (displayMarker) {
        if (userMarker) {
          map.removeLayer(userMarker);
        }

        userMarker = L.marker(
          [latitude, longitude],
          {
            icon: L.divIcon({
              className: "",
              html:
                '<div class="user-pin"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            }),
            title: "Your location"
          }
        ).addTo(map);
      }

      map.flyTo(
        [latitude, longitude],
        10,
        {
          duration: 0.9
        }
      );

      renderQuests();
    }

    function requestLocation() {
      if (!navigator.geolocation) {
        showToast(
          "Location services are not supported in this browser."
        );

        return;
      }

      showToast("Finding your location…");

      navigator.geolocation.getCurrentPosition(
        position => {
          setSearchCenter(
            position.coords.latitude,
            position.coords.longitude
          );

          showToast(
            "Discovery map updated around your location."
          );
        },
        () => {
          showToast(
            "Location access was unavailable. Showing the Ottawa demo area."
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("show");

      window.clearTimeout(
        showToast.timeoutId
      );

      showToast.timeoutId =
        window.setTimeout(
          () =>
            toast.classList.remove("show"),
          2800
        );
    }

    radiusInput.addEventListener(
      "input",
      updateRadius
    );

    searchInput.addEventListener(
      "input",
      renderQuests
    );

    document
      .querySelectorAll(".chip")
      .forEach(chip => {
        chip.addEventListener(
          "click",
          () => {
            activeCategory =
              chip.dataset.category;

            document
              .querySelectorAll(".chip")
              .forEach(item =>
                item.classList.remove("active")
              );

            chip.classList.add("active");
            renderQuests();
          }
        );
      });

    document
      .getElementById("locateButton")
      .addEventListener(
        "click",
        requestLocation
      );

    document
      .getElementById("locateButtonTop")
      .addEventListener(
        "click",
        requestLocation
      );

    document
      .getElementById("resetViewButton")
      .addEventListener(
        "click",
        () => {
          setSearchCenter(
            OTTAWA.lat,
            OTTAWA.lng,
            false
          );

          if (userMarker) {
            map.removeLayer(userMarker);
            userMarker = null;
          }

          showToast(
            "Map reset to the Ottawa demo area."
          );
        }
      );

  document
  .getElementById("closeModalIcon")
  .addEventListener(
    "click",
    closeModal
  );

    modalBackdrop.addEventListener(
      "click",
      event => {
        if (event.target === modalBackdrop) {
          closeModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      event => {
        if (event.key === "Escape") {
          closeModal();
        }
      }
    );

    document
      .getElementById("reportButton")
      .addEventListener(
        "click",
        () => {
          reportForm.classList.toggle("open");
        }
      );

    document
      .querySelectorAll(".report-option")
      .forEach(option => {
        option.addEventListener(
          "click",
          () => {
            selectedReportType =
              option.dataset.report;

            document
              .querySelectorAll(
                ".report-option"
              )
              .forEach(item =>
                item.classList.remove(
                  "selected"
                )
              );

            option.classList.add("selected");
          }
        );
      });

    reportForm.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        if (!selectedReportType) {
          showToast(
            "Choose a report category first."
          );

          return;
        }

        const quest =
          sidequests.find(
            item =>
              item.id === activeQuestId
          );

        const note =
          document
            .getElementById("reportNote")
            .value.trim();

        if (quest) {
          quest.reportTitle =
            selectedReportType;

          quest.reportText =
            note ||
            "Anonymous demo update submitted just now.";

          document.getElementById(
            "modalReportTitle"
          ).textContent =
            quest.reportTitle;

          document.getElementById(
            "modalReportText"
          ).textContent =
            quest.reportText;
        }

        reportForm.classList.remove("open");

        showToast(
          "Demo report added for this page session."
        );
      }
    );

    window.openQuest = openQuest;

    updateRadius();