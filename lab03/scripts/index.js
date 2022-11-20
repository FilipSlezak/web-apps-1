/* eslint-disable no-undef */
let map = null;

const notify = async (title) => {
  if (!title) {
    return;
  }
  if (!("Notification" in window)) {
    return;
  }
  if (Notification.permission !== "denied") {
    const result = await Notification.requestPermission().catch(() => "denied");
    if (result === "denied") {
      return;
    }
  }
  if (Notification.permission === "granted") {
    const notification = new Notification(title);
    return notification;
  } else {
    alert("Notifications disabled, please enable them for app to work !");
  }
  return;
};

const getCurrentPositionAsync = () =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p),
      () => reject("dunno")
    )
  );

const getGeoLocation = async () => {
  const currentPermissions = await navigator.permissions.query({
    name: "geolocation",
  });
  if (currentPermissions.state === "denied") {
    throw Error("Permissions denied");
  }
  if (
    currentPermissions.state === "prompt" ||
    currentPermissions.state === "granted"
  ) {
    const res = getCurrentPositionAsync()
      .then((p) => p)
      .catch(() => {
        throw Error("Error");
      });
    return res;
  }
  throw Error("Dunno");
};

const notifyButtonElement = document.getElementById("notify");
notifyButtonElement.addEventListener("click", () => notify("Hello world!"));

const geoButtonElement = document.getElementById("geo");
geoButtonElement.addEventListener("click", async () => {
  const localization = await getGeoLocation()
    .then((p) => p)
    .catch((e) => {
      alert(e);
      return null;
    });
  if (!localization) {
    return;
  }
});

window.onload = () => {
  map = L.map("map").setView([0, 0], 13);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  getGeoLocation().then((position) => {
    const { latitude, longitude } = position.coords;
    map.setView([latitude, longitude], 13);
    L.marker([latitude, longitude]).addTo(map);
  });
};
