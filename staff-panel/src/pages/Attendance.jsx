import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { MapPin, Clock, Camera, CheckCircle } from 'lucide-react';
import Webcam from 'react-webcam';

export default function Attendance() {
  const AddressDisplay = ({ coords }) => {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchAddress = async () => {
      setLoading(true);
      try {
        const [lat, lon] = coords.split(',').map(s => s.trim());
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        setAddress(data.display_name || 'Address not found');
      } catch (err) {
        setAddress('Error fetching address');
      } finally {
        setLoading(false);
      }
    };

    if (!coords || coords.includes('Denied') || coords.includes('Fetching') || coords.includes('supported')) return null;

    return (
      <div className="mt-1.5 text-xs bg-white/50 p-2 rounded border border-emerald-100 shadow-sm text-left">
        {!address && !loading && (
          <button onClick={fetchAddress} className="text-emerald-600 hover:underline font-semibold flex items-center gap-1">
            <MapPin size={12}/> Fetch Address
          </button>
        )}
        {loading && <span className="text-gray-400 animate-pulse">Fetching...</span>}
        {address && <span className="text-gray-700 font-medium leading-relaxed block">{address}</span>}
      </div>
    );
  };

  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationStr, setLocationStr] = useState('Fetching location...');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  
  const [showWebcam, setShowWebcam] = useState(false); // for stop work
  const [showStartWebcam, setShowStartWebcam] = useState(false);
  const webcamRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchTodayAttendance();
    getLocation();
  }, []);

  useEffect(() => {
    let interval;
    if (attendance && !attendance.end_time) {
      interval = setInterval(() => {
        const start = new Date();
        const [time, modifier] = attendance.start_time.split(' ');
        let [hours, minutes, seconds] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
        
        const startTimeStr = `${attendance.date}T${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
        const startTimeDate = new Date(startTimeStr);
        
        const diff = Math.floor((new Date() - startTimeDate) / 1000);
        if(diff > 0) {
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setElapsedTime(`${h}:${m}:${s}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [attendance]);

  const fetchTodayAttendance = async () => {
    try {
      const res = await api.get('/staff/attendance/today');
      setAttendance(res.data);
    } catch (err) {
      console.error('Error fetching attendance');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationStr(`${position.coords.latitude}, ${position.coords.longitude}`);
        },
        (error) => {
          setLocationStr('Location Access Denied');
        }
      );
    } else {
      setLocationStr('Geolocation not supported');
    }
  };

  const handleStartWork = () => {
    if (locationStr.includes('Denied') || locationStr.includes('Fetching')) {
      return alert('Please allow location access to mark attendance.');
    }
    setShowStartWebcam(true);
  };

  const capturePhotoAndStart = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return alert('Failed to capture photo');

    try {
      const start_time = new Date().toLocaleTimeString();
      await api.post('/staff/attendance/start', { start_time, start_location: locationStr, start_image_url: imageSrc });
      setShowStartWebcam(false);
      fetchTodayAttendance();
    } catch (err) {
      alert(err.response?.data?.error || 'Error starting work');
    }
  };

  const capturePhotoAndStop = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return alert('Failed to capture photo');

    try {
      const end_time = new Date().toLocaleTimeString();
      await api.post('/staff/attendance/stop', { end_time, end_location: locationStr, image_url: imageSrc });
      setShowWebcam(false);
      fetchTodayAttendance();
    } catch (err) {
      alert('Error stopping work');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-8 shadow-lg">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user.name}!</h2>
          <p className="text-emerald-100 max-w-xl">
            Here you can mark your daily attendance, capture your selfie, and automatically record your GPS location. Ensure you mark your attendance on time!
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute bottom-0 right-32 w-32 h-32 rounded-full bg-emerald-400 opacity-20 blur-xl"></div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Today's Attendance</h2>
        <p className="text-gray-500 mb-8">{new Date().toDateString()}</p>

        <div className="flex flex-col justify-center text-sm text-gray-600 bg-gray-50 py-3 px-6 rounded-2xl w-max mx-auto mb-8 border border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-emerald-600"/>
            <span>Current GPS: {locationStr}</span>
          </div>
          <AddressDisplay coords={locationStr} />
        </div>

        {!attendance ? (
          <div>
            <div className="w-48 h-48 mx-auto border-4 border-emerald-100 rounded-full flex flex-col items-center justify-center bg-emerald-50 mb-8">
              <Clock size={40} className="text-emerald-500 mb-2" />
              <span className="text-lg font-bold text-emerald-800">Not Started</span>
            </div>
            
            {!showStartWebcam ? (
              <button 
                onClick={handleStartWork}
                className="bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-emerald-700 transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
              >
                <Camera size={24} /> Take Photo & Start Work
              </button>
            ) : (
              <div className="bg-gray-900 p-4 rounded-xl max-w-sm mx-auto">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="rounded-lg w-full mb-4"
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowStartWebcam(false)}
                    className="flex-1 bg-gray-700 text-white py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={capturePhotoAndStart}
                    className="flex-1 bg-emerald-500 text-white py-2 rounded-lg font-bold"
                  >
                    Capture & Start
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : attendance.end_time ? (
          <div>
            <div className="w-48 h-48 mx-auto border-4 border-gray-100 rounded-full flex flex-col items-center justify-center bg-gray-50 mb-8">
              <CheckCircle size={40} className="text-green-500 mb-2" />
              <span className="text-lg font-bold text-gray-800">Work Completed</span>
            </div>
            <div className="text-left bg-green-50 p-5 rounded-xl border border-green-200 shadow-sm space-y-4">
              <div>
                <p className="text-green-800"><strong>Started:</strong> {attendance.start_time}</p>
                <p className="text-green-800"><strong>Ended:</strong> {attendance.end_time}</p>
              </div>
              
              <div className="pt-3 border-t border-green-200">
                <p className="text-green-800"><strong>Start GPS:</strong> {attendance.start_location}</p>
                <AddressDisplay coords={attendance.start_location} />
              </div>
              
              <div className="pt-3 border-t border-green-200">
                <p className="text-green-800"><strong>End GPS:</strong> {attendance.end_location}</p>
                <AddressDisplay coords={attendance.end_location} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-48 h-48 mx-auto border-4 border-emerald-500 border-t-emerald-200 rounded-full flex flex-col items-center justify-center bg-emerald-50 mb-8 animate-[spin_10s_linear_infinite]">
              <div className="animate-[spin_10s_linear_infinite_reverse] flex flex-col items-center">
                <span className="text-sm font-medium text-emerald-600 uppercase tracking-widest mb-1">Working</span>
                <span className="text-3xl font-bold text-emerald-800">{elapsedTime}</span>
              </div>
            </div>

            {!showWebcam ? (
              <button 
                onClick={() => setShowWebcam(true)}
                className="bg-red-500 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-red-600 transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
              >
                <Camera size={24} /> Stop Work & Take Photo
              </button>
            ) : (
              <div className="bg-gray-900 p-4 rounded-xl max-w-sm mx-auto">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="rounded-lg w-full mb-4"
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowWebcam(false)}
                    className="flex-1 bg-gray-700 text-white py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={capturePhotoAndStop}
                    className="flex-1 bg-emerald-500 text-white py-2 rounded-lg font-bold"
                  >
                    Capture & Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
