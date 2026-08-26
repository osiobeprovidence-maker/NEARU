import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Heart, AlertCircle, Megaphone, X } from "lucide-react";

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/nigeria/nigeria-states.json";

type ActivityType = 'request' | 'offer' | 'event';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  city: string;
  coordinates: [number, number]; // [longitude, latitude]
}

const activities: Activity[] = [
  {
    id: "1",
    type: "request",
    title: "Medical Supplies Needed",
    description: "Local clinic requires basic first aid kits and bandages. Approximate location shared for privacy.",
    city: "Kano",
    coordinates: [8.5167, 12.0022]
  },
  {
    id: "2",
    type: "offer",
    title: "Food Distribution Center",
    description: "Volunteer group distributing rice and essentials every weekend.",
    city: "Abuja",
    coordinates: [3.3792, 6.5244]
  },
  {
    id: "3",
    type: "event",
    title: "Community Town Hall",
    description: "Discussing local infrastructure improvements and volunteer coordination.",
    city: "Abuja",
    coordinates: [7.3986, 9.0765]
  },
  {
    id: "4",
    type: "event",
    title: "Volunteer Training",
    description: "Training session for new volunteers focusing on crisis response.",
    city: "Port Harcourt",
    coordinates: [7.0176, 4.8156]
  },
  {
    id: "5",
    type: "offer",
    title: "Temporary Shelter",
    description: "Safe space available for families displaced by recent floods.",
    city: "Enugu",
    coordinates: [7.5015, 6.4413]
  },
  {
    id: "6",
    type: "request",
    title: "Transport Assistance",
    description: "Need help transporting donated clothes to the rural outskirts.",
    city: "Kaduna",
    coordinates: [7.4383, 10.5222]
  }
];

const getTypeIcon = (type: ActivityType) => {
  switch (type) {
    case 'request': return <AlertCircle className="w-5 h-5 text-rose-500" />;
    case 'offer': return <Heart className="w-5 h-5 text-emerald-500" />;
    case 'event': return <Megaphone className="w-5 h-5 text-indigo-500" />;
  }
};

const getTypeColor = (type: ActivityType) => {
  switch (type) {
    case 'request': return "bg-rose-500";
    case 'offer': return "bg-emerald-500";
    case 'event': return "bg-indigo-500";
  }
};

const getTypeBgColor = (type: ActivityType) => {
  switch (type) {
    case 'request': return "bg-rose-100 text-rose-800";
    case 'offer': return "bg-emerald-100 text-emerald-800";
    case 'event': return "bg-indigo-100 text-indigo-800";
  }
};

export default function MapSection() {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="w-full py-24 bg-zinc-50 relative overflow-hidden" id="interactive-map">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Text Content & Selected Info */}
          <div className="lg:col-span-4 flex flex-col z-10 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Activity across Nigeria
              </h2>
              <p className="text-lg text-zinc-600 leading-relaxed">
                Explore real-time RALLY activities. Locations are approximated to ensure community privacy and safety.
              </p>
            </div>
            
            <div className="flex gap-4 items-center text-sm font-medium text-zinc-500">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500" /> Requests</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Offers</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-500" /> Events</div>
            </div>

            {/* Selected Activity Details */}
            <div className="h-[300px] lg:h-auto">
              <AnimatePresence mode="wait">
                {selectedActivity ? (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-2xl p-6 shadow-xl shadow-zinc-200/50 border border-zinc-100 relative"
                  >
                    <button 
                      onClick={() => setSelectedActivity(null)}
                      className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-xl ${getTypeBgColor(selectedActivity.type)}`}>
                        {getTypeIcon(selectedActivity.type)}
                      </div>
                      <span className="font-medium text-zinc-900 capitalize">
                        {selectedActivity.type}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                      {selectedActivity.title}
                    </h3>
                    <p className="text-zinc-600 text-sm mb-4 leading-relaxed">
                      {selectedActivity.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                      <MapPin className="w-4 h-4" />
                      Approx. {selectedActivity.city}, Nigeria
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-center p-8 text-zinc-500"
                  >
                    <MapPin className="w-8 h-8 mb-3 text-zinc-300" />
                    <p>Select a marker on the map to view activity details.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Map Container */}
          <div className="lg:col-span-8 bg-white rounded-[2rem] p-4 lg:p-8 shadow-2xl shadow-zinc-200/40 border border-zinc-100 relative h-[500px] lg:h-[700px] overflow-hidden">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: isMobile ? 1800 : 2500,
                center: [8.6753, 9.0820]
              }}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup zoom={1} minZoom={1} maxZoom={4} translateExtent={[[0, 0], [800, 600]]}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#f4f4f5"
                        stroke="#d4d4d8"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#e4e4e7", outline: "none" },
                          pressed: { outline: "none" },
                        }}
                      />
                    ))
                  }
                </Geographies>

                {activities.map((activity) => (
                  <Marker 
                    key={activity.id} 
                    coordinates={activity.coordinates}
                    onClick={() => setSelectedActivity(activity)}
                    onMouseEnter={() => setHoveredActivity(activity.id)}
                    onMouseLeave={() => setHoveredActivity(null)}
                    style={{
                      default: { cursor: "pointer" },
                      hover: { cursor: "pointer" },
                      pressed: { cursor: "pointer" }
                    }}
                  >
                    <g transform="translate(-12, -24)">
                      {/* Pulse effect */}
                      <circle 
                        cx="12" 
                        cy="12" 
                        r="12" 
                        className={`animate-ping opacity-20 ${
                          activity.type === 'request' ? 'fill-rose-500' :
                          activity.type === 'offer' ? 'fill-emerald-500' : 'fill-indigo-500'
                        }`}
                      />
                      
                      {/* Marker Pin */}
                      <path
                        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                        className={`stroke-white stroke-2 ${
                          activity.type === 'request' ? 'fill-rose-500' :
                          activity.type === 'offer' ? 'fill-emerald-500' : 'fill-indigo-500'
                        } transition-transform duration-300 ${
                          (selectedActivity?.id === activity.id || hoveredActivity === activity.id) 
                            ? 'scale-125' 
                            : 'scale-100'
                        }`}
                        style={{ transformOrigin: "center bottom" }}
                      />
                      <circle cx="12" cy="10" r="3" fill="white" />
                    </g>
                    
                    {/* City Label */}
                    <text
                      textAnchor="middle"
                      y={12}
                      style={{
                        fontFamily: "system-ui",
                        fill: "#3f3f46",
                        fontSize: "10px",
                        fontWeight: 600,
                        pointerEvents: "none"
                      }}
                      className={`transition-opacity duration-300 ${
                        (selectedActivity?.id === activity.id || hoveredActivity === activity.id)
                          ? "opacity-100"
                          : "opacity-0 lg:opacity-70"
                      }`}
                    >
                      {activity.city}
                    </text>
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
            
            {/* Map Controls hint */}
            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur text-xs font-medium text-zinc-500 px-3 py-1.5 rounded-full border border-zinc-200 shadow-sm">
              Scroll or pinch to zoom
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
