import { useEffect, useState } from "react";
import { GoogleMap, Marker, InfoWindow, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const containerStyle = { width: '100%', height: '70vh' };
const center = { lat: 24.8607, lng: 67.0011 }; // Karachi

export default function LiveMap() {
  const [drivers, setDrivers] = useState([]);
  const [rides, setRides] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: "AIzaSyAJjWCz5-BHOPC8wNki0giXbEXiVwHvULc" });

  useEffect(() => {
    const unsubDrivers = onSnapshot(collection(db, "drivers"), snapshot => {
      setDrivers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubRides = onSnapshot(collection(db, "rides"), snapshot => {
      setRides(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubDrivers(); unsubRides(); };
  }, []);

  if (!isLoaded) return <p>Loading Map...</p>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
      {/* Drivers */}
      {drivers.map(driver => (
        driver.lat && driver.lng && (
          <Marker
            key={driver.id}
            position={{ lat: driver.lat, lng: driver.lng }}
            icon={{
              url: driver.wallet <= 0
                ? "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }}
            onClick={() => setSelectedDriver(driver)}
          />
        )
      ))}

      {selectedDriver && selectedDriver.lat && selectedDriver.lng && (
        <InfoWindow
          position={{ lat: selectedDriver.lat, lng: selectedDriver.lng }}
          onCloseClick={() => setSelectedDriver(null)}
        >
          <div>
            <p><strong>Name:</strong> {selectedDriver.name}</p>
            <p><strong>Wallet:</strong> Rs {selectedDriver.wallet}</p>
            {selectedDriver.wallet <= 0 && <p className="text-red-500">⚠ Zero Balance</p>}
          </div>
        </InfoWindow>
      )}

      {/* Rides */}
      {rides.map(ride => {
        if (ride.pickupLat && ride.pickupLng && ride.dropLat && ride.dropLng &&
            (ride.status === "pending" || ride.status === "assigned")) {
          return (
            <Polyline
              key={ride.id}
              path={[{ lat: ride.pickupLat, lng: ride.pickupLng }, { lat: ride.dropLat, lng: ride.dropLng }]}
              options={{ strokeColor: "#FF0000", strokeWeight: 4 }}
            />
          );
        }
        return null;
      })}

      {rides.map(ride => (
        ride.pickupLat && ride.pickupLng && (
          <Marker
            key={"pickup-" + ride.id}
            position={{ lat: ride.pickupLat, lng: ride.pickupLng }}
            icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
            onClick={() => setSelectedRide(ride)}
          />
        )
      ))}

      {selectedRide && selectedRide.pickupLat && selectedRide.pickupLng && (
        <InfoWindow
          position={{ lat: selectedRide.pickupLat, lng: selectedRide.pickupLng }}
          onCloseClick={() => setSelectedRide(null)}
        >
          <div>
            <p><strong>Customer:</strong> {selectedRide.customerName}</p>
            <p><strong>Status:</strong> {selectedRide.status}</p>
            <p><strong>Fare:</strong> Rs {selectedRide.fare?.Car || 0}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
