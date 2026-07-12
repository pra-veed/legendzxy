import React, { useState, useEffect, useRef, FormEvent, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Download, 
  Send, 
  CheckCircle, 
  Sparkles, 
  MessageSquare, 
  Loader2, 
  ArrowUpRight,
  Search,
  Heart,
  Bookmark,
  Share2,
  X,
  User,
  Check,
  ExternalLink,
  Plus,
  ChevronRight,
  HelpCircle,
  Twitter,
  Linkedin
} from "lucide-react";
import { saveContactInquiry } from "../lib/firebase";

interface Pin {
  id: number;
  title: string;
  artist: string;
  avatar: string;
  category: string;
  resolution: string;
  url: string;
  likes: number;
  commentsCount: number;
  description: string;
  tags: string[];
}

const PIN_ITEMS: Pin[] = [
  {
    id: 1,
    title: "Synthwave Horizon",
    artist: "Extractile Labs AI",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    category: "Synthwave",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=95",
    likes: 342,
    commentsCount: 18,
    description: "Masterfully scaled neon retro landscape with custom glowing grid lines. Optimized for high-bitrate electronic music broadcasts, podcasts, and aesthetic stream headers.",
    tags: ["Neon", "Retro", "Landscape", "1080p"]
  },
  {
    id: 2,
    title: "Celestial Echoes",
    artist: "Prism Digital Studio",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    category: "Podcast Art",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=95",
    likes: 512,
    commentsCount: 24,
    description: "Interstellar oil painting illustration optimized for cosmic-themed podcasts, ambient music backgrounds, and modern classical cover graphics.",
    tags: ["Nebula", "Space", "Cosmic", "Painting"]
  },
  {
    id: 3,
    title: "Vector Aurora Grid",
    artist: "GridMaster Vector",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
    category: "Desktop Wallpapers",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=1000&q=95",
    likes: 189,
    commentsCount: 7,
    description: "Highly geometric vector landscape showcasing glowing fluorescent auroras and a detailed retro wireframe landscape. Built using procedural node arrays.",
    tags: ["Vector", "Aurora", "Wireframe", "Green"]
  },
  {
    id: 4,
    title: "Infinite Ambient Loop",
    artist: "Lofi Beats Collective",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    category: "Lofi Beats",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1000&q=95",
    likes: 675,
    commentsCount: 42,
    description: "Gently shifting pastel sunset clouds overlaying clean desert mountains. Designed as a relaxing visual focus element for multi-hour ambient study live streams.",
    tags: ["Lofi", "Sunset", "Ambient", "Chill"]
  },
  {
    id: 5,
    title: "Neon Grid Synth",
    artist: "Extractile Labs AI",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    category: "Synthwave",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1000&q=95",
    likes: 420,
    commentsCount: 15,
    description: "A vertical synthetic digital grid radiating deep magenta and violet glows. Excellent for mobile device wallpapers, streaming overlays, and vertical content grids.",
    tags: ["Neon", "Vertical", "Purple", "Grid"]
  },
  {
    id: 6,
    title: "Cyberpunk Terminal",
    artist: "Matrix Dev Labs",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    category: "Abstract & 3D",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=1000&q=95",
    likes: 812,
    commentsCount: 56,
    description: "Moody, high-tech terminal dashboard containing custom data visualization modules and neon interface assets. Pure cyberpunk inspiration.",
    tags: ["Terminal", "Cyberpunk", "Interface", "Tech"]
  },
  {
    id: 7,
    title: "Abstract Fluidity",
    artist: "Prism Digital Studio",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    category: "Abstract & 3D",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=95",
    likes: 290,
    commentsCount: 11,
    description: "Highly complex, high-contrast organic liquid movement paths. Delivers a beautifully modern minimalist visual flow layout suitable for branding and backgrounds.",
    tags: ["Abstract", "Fluid", "Modern", "Waves"]
  },
  {
    id: 8,
    title: "Lofi Chill Cafe",
    artist: "Lofi Beats Collective",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    category: "Lofi Beats",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=95",
    likes: 924,
    commentsCount: 68,
    description: "A cozy study environment inside a warm, hand-painted retro lofi coffee shop. Emphasizes soft vintage lighting, coffee steam, and rain-flecked window glass.",
    tags: ["Cozy", "Lofi", "Cafe", "Vintage"]
  },
  {
    id: 9,
    title: "Electric Oasis",
    artist: "GridMaster Vector",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
    category: "Abstract & 3D",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1000&q=95",
    likes: 411,
    commentsCount: 19,
    description: "A gorgeous, neon-flooded electronic tropical garden containing palm tree wireframes resting beneath a deep synthetic dome sky.",
    tags: ["Oasis", "Synth", "Tropical", "Neon"]
  },
  {
    id: 10,
    title: "Cyberpunk Alleyway",
    artist: "Matrix Dev Labs",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    category: "Desktop Wallpapers",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=95",
    likes: 1054,
    commentsCount: 91,
    description: "Atmospheric, vertical street photograph of a futuristic city alleyway in Tokyo. Rich with vibrant glowing advertisements, wet pavement reflections, and cables.",
    tags: ["Tokyo", "Street", "Alley", "Cyberpunk"]
  },
  {
    id: 11,
    title: "Prismatic Dreams",
    artist: "Prism Digital Studio",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    category: "Abstract & 3D",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1515462277126-270d878326e5?auto=format&fit=crop&w=1000&q=95",
    likes: 388,
    commentsCount: 22,
    description: "Intricate 3D render displaying spectral glass chromatic dispersion effects. Light breaks through geometric modules to scatter complex rainbow gradients.",
    tags: ["Holographic", "Glass", "Dispersion", "Rainbow"]
  },
  {
    id: 12,
    title: "Retro Code Terminal",
    artist: "Extractile Labs AI",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    category: "Desktop Wallpapers",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1000&q=95",
    likes: 549,
    commentsCount: 30,
    description: "Retro terminal developer screen displaying procedural script arrays glowing with a golden phosphor light. Pure geek and tech design nostalgia.",
    tags: ["Developer", "Phosphor", "Code", "Retro"]
  },
  {
    id: 13,
    title: "Velvet Twilight",
    artist: "Lofi Beats Collective",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    category: "Lofi Beats",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&w=1000&q=95",
    likes: 476,
    commentsCount: 14,
    description: "Deep amethyst and amber cloud arrays. Provides a beautifully mellow and melancholic background suited for sleep beats and lofi streaming playlists.",
    tags: ["Clouds", "Sky", "Mellow", "Melancholy"]
  },
  {
    id: 14,
    title: "Digital Mirage",
    artist: "GridMaster Vector",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
    category: "Podcast Art",
    resolution: "3840 x 2160 (4K UHD)",
    url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1000&q=95",
    likes: 310,
    commentsCount: 9,
    description: "A modern glitch art interpretation layered over clean minimalist sand dunes. Merges physical desert warmth with futuristic structural encoding errors.",
    tags: ["Glitch", "Dunes", "Minimalist", "Aesthetic"]
  }
];

const EXTRA_UNSPLASH_IDS = [
  "photo-1509198397868-475647b2a1e5", // neon
  "photo-1535223289827-42f1e9919769", // future
  "photo-1478760329108-5c3ed9d495a0", // galaxy
  "photo-1516259762381-22954d7d3ad2", // tech
  "photo-1502657877623-f66bf489d236", // landscape
  "photo-1547891654-e66ed7edd96c", // watercolor
  "photo-1561736778-92e52a7769ef", // workspace
  "photo-1501386761578-eac5c94b800a", // crowd music
  "photo-1511671782779-c97d3d27a1d4", // podcast
  "photo-1487180142328-0c4e37023af5", // abstract vinyl
  "photo-1514525253161-7a46d19cd819", // party lights
  "photo-1504280390367-361c6d9f38f4", // cozy campfire
  "photo-1518609878373-06d740f60d8b", // neon show
  "photo-1519681393784-d120267933ba", // starry peak
  "photo-1520038410233-7141be7e6f97", // minimalist
  "photo-1533174072545-7a4b6ad7a6c3", // purple dj
  "photo-1531315630201-bb15abeb1653", // cyan futuristic
  "photo-1557672172-298e090bd0f1", // fluid art
  "photo-1550745165-9bc0b252726f", // retro gaming
  "photo-1569336415962-a4bd9f69cd83", // synth wave sunrise
  "photo-1579546929518-9e396f3cc809", // neon fluid gradient
  "photo-1526374965328-7f61d4dc18c5", // digital green code matrix
  "photo-1543852786-1cf6624b9987", // purple tokyo alley
  "photo-1581091226825-a6a2a5aee158", // circuit board neon
  "photo-1506157786151-b8491531f063", // psych music
  "photo-1493225457124-a3eb161ffa5f", // vintage record deck
  "photo-1513829096960-ef229e5230ab", // bar sign neon
  "photo-1505740420928-5e560c06d30e", // headphones close up
  "photo-1446776811953-b23d57bd21aa", // satellite earth
  "photo-1451187580459-43490279c0fa", // internet hub
  "photo-1484704849700-f032a568e944", // gramophone playing
  "photo-1483475116795-752880d7012f", // hacker keyboard
  "photo-1485827404703-89b55fcc595e", // sci-fi robot
  "photo-1518173946687-a4c8a383392c", // macro leaf droplet
  "photo-1524169358666-79f22534bc67", // prism scatter paint
  "photo-1534447677768-be436bb09401", // dynamic light speed
  "photo-1510915228340-29c85a43dcfe", // coder portrait dark
  "photo-1516116211223-4c359a365de8", // mechanical keyboard glow
  "photo-1542751371-adc38448a05e", // gaming setup keyboard
  "photo-1551269901-5c5e14c25df7", // workspace loft setup
  "photo-1567095761054-7a02e69e5c43", // abstract gold paint
  "photo-1579783902614-a3fb3927b6a5", // vintage flowers retro
  "photo-1508138221679-760a23a2285b", // misty woods and aurora
  "photo-1511512578047-dfb367046420", // glowing neon arcade room
  "photo-1516321318423-f06f85e504b3", // corporate tech digital
  "photo-1531297484001-80022131f5a1", // neon abstract lines
  "photo-1548345680-f5475ea5df84", // red blue gradient fluid
  "photo-1563986768609-322da13575f3", // abstract web design/cyberpunk graphics
  "photo-1518770660439-4636190af475", // quantum processor glow
  "photo-1562813733-b31f71025d54", // developer night workstation
  "photo-1555066931-4365d14bab8c", // modern vscode editor code
  "photo-1542831371-29b0f74f9713", // server room blinking lights
  "photo-1454789548928-9efd52dc4031", // deep nebulas constellation
  "photo-1506744038136-46273834b3fb", // pink canyon horizon
  "photo-1534796636912-3b95b3ab5986", // mountains and aurora
  "photo-1507525428034-b723cf961d3e", // sunset seashore line
  "photo-1470071459604-3b5ec3a7fe05", // emerald deep forest
  "photo-1441974231531-c6227db76b6e", // rays in foggy forest
  "photo-1472214222541-d510753a49fa", // lavender fields retro sun
  "photo-1486572788966-cfd3df1f5b42", // pixel arcade console
  "photo-1501854140801-50d01698950b", // rolling landscape green hills
  "photo-1492684223066-81342ee5ff30", // bokeh retro concert lights
  "photo-1536440136628-849c177e76a1", // movie theatre signage
  "photo-1522071820081-009f0129c71c", // corporate group discussion
  "photo-1511556532299-8f662fc26c06", // neon art gallery
  "photo-1554188248-986adbb73be4", // colorful abstract vector wave
  "photo-1502239608882-93b729c6af43", // ambient party neon lights
  "photo-1563245372-f21724e3856d", // cyberpunk retro grid cityscape
  "photo-1508921912186-1d1a45ebb3c1", // magenta retro sky lighting
  "photo-1516450360452-9312f5e86fc7", // retro synth music party stage
  "photo-1574169208507-84376144848b", // 3D colorful fluid movement
  "photo-1553356084-58ef4a67b2a7", // abstract liquid paint explosion
  "photo-1517694712202-14dd9538aa97"  // neon developer typing on keyboard
];

const generateUniquePin = (id: number, targetCategory?: string): Pin => {
  const categories = ["Synthwave", "Podcast Art", "Lofi Beats", "Abstract & 3D", "Desktop Wallpapers"];
  const cat = targetCategory && targetCategory !== "All" && targetCategory !== "Saved Board" 
    ? targetCategory 
    : categories[id % categories.length];

  const artists = ["Extractile Labs AI", "Prism Digital Studio", "GridMaster Vector", "Lofi Beats Collective", "Matrix Dev Labs", "Spectral Chroma Studio", "Retro Future Collective", "Aether Wave Design"];
  const artist = artists[(id * 7) % artists.length];

  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
  ];
  const avatar = avatars[id % avatars.length];

  const titles = [
    "Quantum Field Resonance", "Neon Alley Drift", "Sunset Highway Chill", "Retro Coding Space", "Geometric Prism Matrix",
    "Cozy Library Study", "Holographic Wave Sound", "Celestial Space Terminal", "Cyber Lounge Ambient", "Retro Grid Pulse",
    "Abstract Marbled Fluid", "Acoustic Forest Echo", "Vaporwave Cloud Burst", "Chrome Drift Runner", "Lofi Sunset Horizon",
    "Prismatic Spectrum Flow", "Digital Circuit Horizon", "Deep Velvet Nebula", "Metropolitan Neon Sky", "Monastic Soundstage"
  ];
  const title = `${titles[id % titles.length]} #${id}`;

  const imgId = EXTRA_UNSPLASH_IDS[(id - 1) % EXTRA_UNSPLASH_IDS.length];
  const url = `https://images.unsplash.com/${imgId}?auto=format&fit=crop&w=1000&q=95&sig=${id}`;

  const likes = 200 + ((id * 43) % 900);
  const commentsCount = 8 + ((id * 9) % 60);

  const descriptions = [
    "An upscaled digital rendering depicting pristine atmospheric waves, engineered using Extractile's premium lossy-to-lossless scaling neural nodes.",
    "A gorgeous community-contributed showcase piece. Optimized for ultra-high bitrate digital projection stream grids and custom vector scaling boards.",
    "A captivating organic visual structure featuring rich chromatic saturation and geometric wireframe overlays. Rendered in pristine 4K resolution specs."
  ];
  const description = descriptions[id % descriptions.length];

  const tags = [cat.split(" ")[0], "HighFidelity", "ProAsset", "UniqueCapture"];

  return {
    id,
    title,
    artist,
    avatar,
    category: cat,
    resolution: "3840 x 2160 (4K UHD)",
    url,
    likes,
    commentsCount,
    description,
    tags
  };
};

const CATEGORIES = ["All", "Synthwave", "Podcast Art", "Lofi Beats", "Abstract & 3D", "Desktop Wallpapers", "Saved Board"];

export default function ShowcaseView({ 
  onTriggerAlert 
}: { 
  onTriggerAlert: (title: string, message: string) => void 
}) {
  // Search and Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Dynamic non-repeating pins state for infinite scroll
  const [pins, setPins] = useState<Pin[]>(PIN_ITEMS);
  const [loadingMore, setLoadingMore] = useState(false);

  // Interaction Storage Memory
  const [savedPinIds, setSavedPinIds] = useState<number[]>([]);
  const [likedPinIds, setLikedPinIds] = useState<number[]>([]);
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [pinComments, setPinComments] = useState<{ [key: number]: any[] }>({});

  // Active Interactive Overlay Modal
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [similarPins, setSimilarPins] = useState<Pin[]>([]);
  
  // Exporter specs inside the Pin Modal
  const [downloadFormat, setDownloadFormat] = useState<"JPEG" | "PNG" | "WEBP">("JPEG");
  const [downloadRes, setDownloadRes] = useState<"4K" | "2K" | "1080P">("4K");
  const [isDownloading, setIsDownloading] = useState(false);

  // New Comment Form State
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  // Contact Drawer State (Integrates original form)
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("API Ingestion Integration");
  const [contactMessage, setContactMessage] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Custom Responsive Column Count Hook logic directly inside
  const [columnCount, setColumnCount] = useState(4);

  // Load more function
  const loadMorePins = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPins(prev => {
        const nextBatch: Pin[] = [];
        const baseId = prev.length + 1;
        for (let i = 0; i < 12; i++) {
          nextBatch.push(generateUniquePin(baseId + i));
        }
        return [...prev, ...nextBatch];
      });
      setLoadingMore(false);
    }, 700);
  };

  // Window Scroll infinite loader
  useEffect(() => {
    const handleScroll = () => {
      if (selectedCategory === "Saved Board") return; // No infinite scroll inside saved board
      
      const threshold = 150;
      const position = window.innerHeight + window.scrollY;
      const height = document.documentElement.scrollHeight;
      
      if (position >= height - threshold) {
        loadMorePins();
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pins.length, loadingMore, selectedCategory]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setColumnCount(1);
      else if (width < 1024) setColumnCount(2);
      else if (width < 1280) setColumnCount(3);
      else setColumnCount(4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load localStorage interactions
  useEffect(() => {
    const storedSaved = localStorage.getItem("extractile_saved_pins");
    const storedLikes = localStorage.getItem("extractile_liked_pins");
    const storedFollows = localStorage.getItem("extractile_followed_creators");
    const storedComments = localStorage.getItem("extractile_pin_comments");

    if (storedSaved) setSavedPinIds(JSON.parse(storedSaved));
    if (storedLikes) setLikedPinIds(JSON.parse(storedLikes));
    if (storedFollows) setFollowedCreators(JSON.parse(storedFollows));
    
    if (storedComments) {
      setPinComments(JSON.parse(storedComments));
    } else {
      // Seed initial comments to make the app feel alive and organic
      const initialComments: { [key: number]: any[] } = {};
      PIN_ITEMS.forEach(pin => {
        initialComments[pin.id] = [
          {
            id: 1,
            author: "AestheticNode",
            text: `Love this render! Downscaling to 1080P worked flawlessly with Extractile's engine.`,
            timestamp: "2 hours ago"
          },
          {
            id: 2,
            author: "NeonGlow_99",
            text: `The colors on this match my desktop stream aesthetic perfectly. Saved to board!`,
            timestamp: "4 hours ago"
          }
        ];
      });
      setPinComments(initialComments);
      localStorage.setItem("extractile_pin_comments", JSON.stringify(initialComments));
    }
  }, []);

  // Sync state changes to LocalStorage
  const updateSavedPins = (newSaved: number[]) => {
    setSavedPinIds(newSaved);
    localStorage.setItem("extractile_saved_pins", JSON.stringify(newSaved));
  };

  const updateLikedPins = (newLikes: number[]) => {
    setLikedPinIds(newLikes);
    localStorage.setItem("extractile_liked_pins", JSON.stringify(newLikes));
  };

  const updateFollowedCreators = (newFollows: string[]) => {
    setFollowedCreators(newFollows);
    localStorage.setItem("extractile_followed_creators", JSON.stringify(newFollows));
  };

  const saveNewComment = (pinId: number, author: string, text: string) => {
    const commentsList = pinComments[pinId] || [];
    const updatedComments = [
      ...commentsList,
      {
        id: Date.now(),
        author: author.trim() || "Anonymous Operator",
        text: text.trim(),
        timestamp: "Just now"
      }
    ];
    const newCommentsState = { ...pinComments, [pinId]: updatedComments };
    setPinComments(newCommentsState);
    localStorage.setItem("extractile_pin_comments", JSON.stringify(newCommentsState));
  };

  // Toggle Pins
  const handleToggleSave = (pinId: number, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const index = savedPinIds.indexOf(pinId);
    let newSaved = [...savedPinIds];
    if (index >= 0) {
      newSaved.splice(index, 1);
      onTriggerAlert("Removed from Board", "Pin was removed from your offline Saved Board.");
    } else {
      newSaved.push(pinId);
      onTriggerAlert("Saved to Board", "Pin was saved securely to your offline Saved Board!");
    }
    updateSavedPins(newSaved);
  };

  const handleToggleLike = (pinId: number, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const index = likedPinIds.indexOf(pinId);
    let newLikes = [...likedPinIds];
    if (index >= 0) {
      newLikes.splice(index, 1);
    } else {
      newLikes.push(pinId);
    }
    updateLikedPins(newLikes);
  };

  const handleToggleFollow = (artistName: string) => {
    const isFollowing = followedCreators.includes(artistName);
    let newFollows = [...followedCreators];
    if (isFollowing) {
      newFollows = newFollows.filter(name => name !== artistName);
      onTriggerAlert("Unfollowed Creator", `You unfollowed ${artistName}.`);
    } else {
      newFollows.push(artistName);
      onTriggerAlert("Following Creator", `You are now following ${artistName}!`);
    }
    updateFollowedCreators(newFollows);
  };

  // Open Detailed Pin Modal with recommendations
  const handleOpenPin = (pin: Pin) => {
    setSelectedPin(pin);
    // Find up to 3 similar pins in same category, exclude active one
    const similar = pins.filter(item => item.category === pin.category && item.id !== pin.id).slice(0, 3);
    setSimilarPins(similar);
    setNewCommentName("");
    setNewCommentText("");
  };

  // Download logic mapping formats and resolutions
  const downloadPinAsset = async (imgUrl: string, titleStr: string, format: string, res: string) => {
    setIsDownloading(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imgUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        
        let width = 3840;
        let height = 2160;
        if (res === "2K") {
          width = 2560;
          height = 1440;
        } else if (res === "1080P") {
          width = 1920;
          height = 1080;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let mimeType = "image/jpeg";
          let ext = "jpg";
          if (format === "PNG") {
            mimeType = "image/png";
            ext = "png";
          } else if (format === "WEBP") {
            mimeType = "image/webp";
            ext = "webp";
          }

          canvas.toBlob((blob) => {
            if (blob) {
              const urlBlob = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = urlBlob;
              a.download = `${titleStr.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${res.toLowerCase()}.${ext}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              onTriggerAlert("Download Succeeded", `Compiled and saved "${titleStr}" as upscaled ${res} ${format}.`);
            }
            setIsDownloading(false);
          }, mimeType, 0.98);
        } else {
          setIsDownloading(false);
        }
      };
      img.onerror = () => {
        setIsDownloading(false);
        onTriggerAlert("Compilation Failed", "Failed to compile background artwork asset canvas layers.");
      };
    } catch (err) {
      console.error(err);
      setIsDownloading(false);
      onTriggerAlert("Cross-Origin Blocked", "Network constraints prevented downloading this sample. Try copying the link directly.");
    }
  };

  // Social Sharing Pipeline
  const handleShare = (platform: "twitter" | "linkedin" | "native", pin: Pin) => {
    const text = `Check out "${pin.title}" by ${pin.artist} on Extractile Pro! Digital artwork extracted with AI resolution upscaling:`;
    const shareUrl = pin.url;

    if (platform === "twitter") {
      const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(xUrl, "_blank", "noopener,noreferrer");
      onTriggerAlert("Shared to X/Twitter", `Opening tweet dialogue for "${pin.title}".`);
    } else if (platform === "linkedin") {
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      window.open(linkedInUrl, "_blank", "noopener,noreferrer");
      onTriggerAlert("Shared to LinkedIn", `Opening LinkedIn post dialogue for "${pin.title}".`);
    } else if (platform === "native") {
      if (navigator.share) {
        navigator.share({
          title: pin.title,
          text: text,
          url: shareUrl,
        }).catch((err) => {
          console.error("Web share error", err);
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        onTriggerAlert("Link Copied", "Direct asset URL copied to clipboard!");
      }
    }
  };

  // Contact Form Handlers (Syncs original Firestore connection)
  const validateContactForm = () => {
    const errors: { [key: string]: string } = {};
    if (!contactName.trim()) {
      errors.name = "Provide your name or company identifier.";
    }
    if (!contactEmail.trim()) {
      errors.email = "Reply email is required.";
    } else if (!/\S+@\S+\.\S+/.test(contactEmail)) {
      errors.email = "Invalid email formatting.";
    }
    if (!contactMessage.trim()) {
      errors.message = "Message text cannot remain empty.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateContactForm()) return;

    setFormStatus("submitting");
    try {
      await saveContactInquiry({
        name: contactName,
        email: contactEmail,
        subject: contactSubject,
        message: contactMessage
      });
      setFormStatus("success");
      onTriggerAlert("Inquiry Logged", "Inquiry saved inside Firestore DB. Our operations board has been notified.");
    } catch (err: any) {
      console.error(err);
      setFormStatus("idle");
      onTriggerAlert("Transmission Error", "Inquiry failed to sync. Ensure connection is active.");
    }
  };

  const resetContactForm = () => {
    setContactName("");
    setContactEmail("");
    setContactSubject("API Ingestion Integration");
    setContactMessage("");
    setFormErrors({});
    setFormStatus("idle");
  };

  // Submit Comments Inside Pin
  const handleCommentSubmit = (e: FormEvent, pinId: number) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    
    saveNewComment(pinId, newCommentName, newCommentText);
    setNewCommentName("");
    setNewCommentText("");
    onTriggerAlert("Comment Posted", "Your comment has been indexed in client memory cache.");
  };

  // Filter & Search Matcher
  const filteredPins = pins.filter(pin => {
    const matchesSearch = 
      pin.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === "All") {
      return matchesSearch;
    } else if (selectedCategory === "Saved Board") {
      return savedPinIds.includes(pin.id) && matchesSearch;
    } else {
      return pin.category === selectedCategory && matchesSearch;
    }
  });

  // Distribute items into columns round-robin for true masonry rendering
  const getColumns = (items: Pin[], numCols: number) => {
    const columns: Pin[][] = Array.from({ length: numCols }, () => []);
    items.forEach((item, index) => {
      columns[index % numCols].push(item);
    });
    return columns;
  };

  const masonryColumns = getColumns(filteredPins, columnCount);

  return (
    <div className="w-full flex flex-col gap-8 pb-10" id="showcase-pinterest-container">
      
      {/* Visual Pinterest Top-Bar Navigation */}
      <section className="flex flex-col gap-6 border border-primary bg-surface p-6 shadow-[3px_3px_0px_var(--color-primary)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-secondary" />
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 border border-primary/10 text-secondary">
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-secondary block">
                EXTRACTILE STUDIO CREATIVE HUB
              </span>
              <h1 className="font-serif font-bold text-xl uppercase tracking-tight text-primary leading-tight mt-0.5">
                The Creative Showcase Board
              </h1>
            </div>
          </div>

          {/* Quick Contact Form Button */}
          <button
            type="button"
            onClick={() => {
              resetContactForm();
              setShowContactDrawer(true);
            }}
            className="w-full md:w-auto px-4 py-2.5 bg-primary hover:bg-secondary text-on-primary font-mono text-[10px] font-black tracking-widest uppercase rounded-none cursor-pointer flex items-center justify-center gap-2 transition-all shadow-[2px_2px_0px_#1b222c]"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>REQUEST ENTERPRISE INTEGRATION</span>
          </button>
        </div>

        {/* Pinterest Style Central Search Bar */}
        <div className="relative w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search high-fidelity pins, categories, creators, tags (e.g. Neon, Cozy, Lofi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#e4eaf0]/50 dark:bg-[#1b222c]/40 border border-primary/20 hover:border-primary/40 focus:border-secondary focus:bg-background rounded-full pl-12 pr-6 py-3.5 font-mono text-xs focus:outline-none transition-all placeholder:text-on-surface-variant/60 text-primary shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            const count = cat === "All" 
              ? PIN_ITEMS.length 
              : cat === "Saved Board" 
                ? savedPinIds.length 
                : PIN_ITEMS.filter(p => p.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-mono rounded-full font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap border transition-all ${
                  isActive 
                    ? "bg-primary border-primary text-on-primary shadow-sm" 
                    : "bg-[#e4eaf0]/30 dark:bg-[#1b222c]/10 border-primary/10 hover:border-primary/40 hover:bg-[#e4eaf0]/60 dark:hover:bg-[#1b222c]/30 text-on-surface-variant"
                }`}
              >
                {cat}
                <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-secondary text-on-secondary" : "bg-primary/5 text-primary/60"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Staggered Columns Masonry Grid */}
      <AnimatePresence mode="popLayout">
        {filteredPins.length > 0 ? (
          <motion.div 
            className="flex gap-4 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {masonryColumns.map((col, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4 flex-1">
                {col.map((pin) => {
                  const isSaved = savedPinIds.includes(pin.id);
                  const isLiked = likedPinIds.includes(pin.id);

                  return (
                    <motion.div
                      key={pin.id}
                      layoutId={`pin-card-${pin.id}`}
                      onClick={() => handleOpenPin(pin)}
                      className="group bg-surface border border-primary hover:border-secondary overflow-hidden flex flex-col cursor-pointer hover:shadow-[4px_4px_0px_rgba(26,26,26,0.15)] relative transition-all duration-200"
                    >
                      {/* Image Container with Dynamic Height */}
                      <div className="relative overflow-hidden w-full bg-neutral-900">
                        <img
                          src={pin.url}
                          alt={pin.title}
                          className="w-full object-cover select-none group-hover:scale-102 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        
                        {/* Pinterest Hover Actions Overlay */}
                        <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-between z-10">
                          
                          {/* Top row overlays */}
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[9px] font-mono text-white/90 bg-neutral-900/80 px-2 py-1 tracking-wider uppercase font-bold border border-white/10">
                              {pin.category}
                            </span>
                            
                            <button
                              type="button"
                              onClick={(e) => handleToggleSave(pin.id, e)}
                              className={`px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-wider rounded-none cursor-pointer border flex items-center gap-1 transition-all ${
                                isSaved 
                                  ? "bg-rose-700 border-rose-800 text-white shadow-inner" 
                                  : "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-900"
                              }`}
                            >
                              {isSaved ? <Check className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                              <span>{isSaved ? "Saved" : "Save"}</span>
                            </button>
                          </div>

                          {/* Bottom row overlays */}
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => handleToggleLike(pin.id, e)}
                                className={`p-1.5 bg-neutral-900/80 hover:bg-neutral-900 hover:text-rose-500 rounded-none border border-neutral-700 text-white cursor-pointer transition-colors ${
                                  isLiked ? "text-rose-500" : ""
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                              </button>
                            </div>

                            <div className="p-1.5 bg-neutral-900/80 hover:bg-neutral-900 rounded-none border border-neutral-700 text-white hover:text-secondary transition-colors">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Under-pin Content Info */}
                      <div className="p-3.5 border-t border-primary/5 flex flex-col gap-1.5 bg-[#fcfbfa]/60 dark:bg-[#121826]/10">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-serif font-bold text-xs text-primary leading-tight group-hover:text-secondary transition-colors">
                            {pin.title}
                          </h4>
                          <span className="font-mono text-[9px] text-on-surface-variant shrink-0">
                            {pin.resolution.split(" ")[0]}
                          </span>
                        </div>
                        
                        {/* Creator Avatar Info */}
                        <div className="flex items-center gap-2 pt-1 border-t border-primary/5 mt-1">
                          <img 
                            src={pin.avatar} 
                            alt={pin.artist} 
                            className="w-5 h-5 rounded-full object-cover border border-primary/10"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-mono text-[9px] text-on-surface-variant font-bold truncate">
                            {pin.artist}
                          </span>
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="flex flex-col items-center justify-center py-24 border border-dashed border-primary/25 bg-surface text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="p-4 bg-primary/5 rounded-full border border-primary/10 text-on-surface-variant mb-4">
              <Bookmark className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-normal text-xl text-primary uppercase">No matching pins detected</h3>
            <p className="text-xs text-on-surface-variant font-mono mt-1 max-w-sm">
              Try adjusting your query string or switch back to the "All" category. If searching "Saved Board", ensure you have pinned some assets first!
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 px-4 py-2 border border-primary hover:border-secondary font-mono text-[9px] font-black uppercase tracking-wider rounded-none cursor-pointer"
            >
              RESET ALL FILTERS
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loadingMore && (
        <div className="w-full py-10 flex flex-col items-center justify-center gap-3 border border-dashed border-primary/20 bg-[#e4e2f2]/20 dark:bg-[#101738]/20 rounded-none">
          <Loader2 className="w-6 h-6 text-secondary animate-spin" />
          <span className="text-[10px] font-mono font-bold text-primary/70 uppercase tracking-widest animate-pulse">
            Extracting & Upscaling More Unique Pro Pins...
          </span>
        </div>
      )}

      {/* Promoted / Sponsored Banner inside showcase */}
      <section className="bg-[#e4eaf0]/40 dark:bg-[#1b222c]/10 border border-primary p-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-4 relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono font-bold bg-secondary/15 text-secondary px-1.5 py-0.5 rounded-none border border-secondary/15 tracking-wider uppercase">
              SPONSORED
            </span>
            <span className="font-serif font-bold text-xs text-primary uppercase">Extractile Labs Custom pipelines</span>
          </div>
          <p className="text-xs text-on-surface-variant font-mono leading-normal">
            Need lossless multi-link CDN extractions or dedicated container orchestration for enterprise automation? Partner directly with our core engineering teams.
          </p>
        </div>
        <button
          onClick={() => {
            resetContactForm();
            setShowContactDrawer(true);
          }}
          className="w-full md:w-auto px-4 py-2.5 bg-primary hover:bg-secondary text-on-primary font-mono text-[9px] font-black tracking-widest uppercase rounded-none cursor-pointer shrink-0 transition-colors"
        >
          INITIATE INQUIRY
        </button>
      </section>

      {/* 1. Immersive Pinterest-Style Split Overlay Modal */}
      <AnimatePresence>
        {selectedPin && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="bg-surface border border-primary max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 shadow-[8px_8px_0px_#1b222c] overflow-hidden rounded-none relative my-auto"
              id="pinterest-pin-overlay-modal"
            >
              {/* Close Button overlay */}
              <button
                type="button"
                onClick={() => setSelectedPin(null)}
                className="absolute top-4 right-4 p-2 bg-background hover:bg-primary hover:text-on-primary border border-primary/20 hover:border-primary transition-all cursor-pointer z-20 rounded-none shadow-[2px_2px_0px_rgba(0,0,0,0.1)]"
                aria-label="Close detailed view"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Left Column: Image Sandbox with controls */}
              <div className="bg-neutral-950 flex flex-col justify-between relative border-r border-primary/10">
                
                {/* Image showcase wrapper */}
                <div className="flex-grow flex items-center justify-center p-3 relative aspect-square md:aspect-auto md:h-[520px]">
                  <img
                    src={selectedPin.url}
                    alt={selectedPin.title}
                    className="max-w-full max-h-[500px] object-contain select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Left Panel Metadata Strip */}
                <div className="p-4 bg-[#121826] border-t border-primary/15 text-white/95 flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono text-white/50 block">RESOLUTION SPEC</span>
                    <span className="font-mono text-xs font-bold truncate text-secondary block">{selectedPin.resolution}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const isLiked = likedPinIds.includes(selectedPin.id);
                        handleToggleLike(selectedPin.id);
                      }}
                      className={`p-2 border border-white/10 hover:border-white/30 hover:bg-white/5 text-white cursor-pointer transition-colors ${
                        likedPinIds.includes(selectedPin.id) ? "text-rose-500 border-rose-500/35 hover:bg-rose-500/5" : ""
                      }`}
                      title="Like Pin"
                    >
                      <Heart className={`w-4 h-4 ${likedPinIds.includes(selectedPin.id) ? "fill-rose-500" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedPin.url);
                        onTriggerAlert("URL Copied", "Direct asset URL copied to clipboard.");
                      }}
                      className="p-2 border border-white/10 hover:border-white/30 hover:bg-white/5 text-white cursor-pointer transition-colors"
                      title="Copy Direct URL Link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Interaction, Formats, Following & Live Comments */}
              <div className="p-6 flex flex-col justify-between max-h-[600px] md:max-h-[584px] overflow-y-auto bg-surface" id="pin-modal-right-viewport">
                
                {/* Header Creator Row */}
                <div className="flex items-center justify-between border-b border-primary/10 pb-4 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={selectedPin.avatar} 
                      alt={selectedPin.artist} 
                      className="w-10 h-10 rounded-full object-cover border border-primary/15"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h5 className="font-serif font-bold text-sm text-primary truncate leading-tight">
                        {selectedPin.artist}
                      </h5>
                      <span className="font-mono text-[9px] text-on-surface-variant tracking-wider uppercase block mt-0.5">
                        {followedCreators.includes(selectedPin.artist) ? "FOLLOWING CREATOR" : "VERIFIED CREATOR"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(selectedPin.artist)}
                    className={`px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-widest rounded-none border cursor-pointer transition-all ${
                      followedCreators.includes(selectedPin.artist)
                        ? "bg-[#e4eaf0] dark:bg-[#1b222c] border-primary/25 text-on-surface-variant hover:border-rose-700 hover:text-rose-700"
                        : "bg-primary border-primary text-on-primary hover:bg-secondary hover:border-secondary"
                    }`}
                  >
                    {followedCreators.includes(selectedPin.artist) ? "FOLLOWED" : "FOLLOW"}
                  </button>
                </div>

                {/* Title & Metadata Descriptions */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-serif font-black text-2xl text-primary tracking-tight leading-none">
                      {selectedPin.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleToggleSave(selectedPin.id)}
                      className={`px-3.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider rounded-none cursor-pointer flex items-center gap-1 shrink-0 ${
                        savedPinIds.includes(selectedPin.id)
                          ? "bg-rose-700 text-white"
                          : "bg-secondary text-on-secondary hover:opacity-95"
                      }`}
                    >
                      {savedPinIds.includes(selectedPin.id) ? "SAVED" : "SAVE TO BOARD"}
                    </button>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {selectedPin.description}
                  </p>

                  {/* Hash Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedPin.tags.map(t => (
                      <span key={t} className="text-[9px] font-mono bg-primary/5 px-2 py-0.5 border border-primary/5 text-on-surface-variant font-bold">
                        #{t.toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social Share Section */}
                <div className="border border-primary p-4 bg-[#fcfbfa] dark:bg-[#121826]/40 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-primary font-black">
                      <Share2 className="w-3.5 h-3.5 text-secondary animate-pulse" />
                      <span>Social Sharing Matrix</span>
                    </div>
                    <span className="text-[8px] font-mono text-on-surface-variant bg-primary/5 px-2 py-0.5 border border-primary/5">
                      DIRECT BROADCAST
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Twitter / X */}
                    <button
                      type="button"
                      onClick={() => handleShare("twitter", selectedPin)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-surface hover:bg-[#1b222c] dark:hover:bg-primary border border-primary text-primary dark:hover:text-on-primary font-mono text-[9px] font-bold uppercase transition-all duration-150 cursor-pointer rounded-none hover:shadow-[2px_2px_0px_var(--color-secondary)]"
                    >
                      <Twitter className="w-3.5 h-3.5 text-sky-500 fill-sky-500/10" />
                      <span>X / TWITTER</span>
                    </button>

                    {/* LinkedIn */}
                    <button
                      type="button"
                      onClick={() => handleShare("linkedin", selectedPin)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-surface hover:bg-[#1b222c] dark:hover:bg-primary border border-primary text-primary dark:hover:text-on-primary font-mono text-[9px] font-bold uppercase transition-all duration-150 cursor-pointer rounded-none hover:shadow-[2px_2px_0px_var(--color-secondary)]"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-blue-600 fill-blue-600/10" />
                      <span>LINKEDIN</span>
                    </button>

                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={() => handleShare("native", selectedPin)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-surface hover:bg-[#1b222c] dark:hover:bg-primary border border-primary text-primary dark:hover:text-on-primary font-mono text-[9px] font-bold uppercase transition-all duration-150 cursor-pointer rounded-none hover:shadow-[2px_2px_0px_var(--color-secondary)]"
                    >
                      <Share2 className="w-3.5 h-3.5 text-secondary" />
                      <span>COPY LINK</span>
                    </button>
                  </div>
                </div>

                {/* Custom Format Exporter (Integrates Premium Custom Downloader) */}
                <div className="bg-[#e4eaf0]/40 dark:bg-[#1b222c]/10 border border-primary/10 p-4.5 my-4 space-y-3.5">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-primary font-black">
                    <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
                    <span>Resolution Multiplex Exporter</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-mono uppercase text-on-surface-variant font-bold block mb-1">
                        Format Wrapper
                      </label>
                      <select
                        value={downloadFormat}
                        onChange={(e) => setDownloadFormat(e.target.value as "JPEG" | "PNG" | "WEBP")}
                        className="w-full bg-surface text-on-surface border border-primary/20 font-mono text-[10px] px-2 py-1.5 focus:border-secondary focus:outline-none rounded-none cursor-pointer"
                      >
                        <option value="JPEG">JPEG (.jpg)</option>
                        <option value="PNG">PNG Lossless</option>
                        <option value="WEBP">WEBP Standard</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[8px] font-mono uppercase text-on-surface-variant font-bold block mb-1">
                        Target Scale
                      </label>
                      <select
                        value={downloadRes}
                        onChange={(e) => setDownloadRes(e.target.value as "4K" | "2K" | "1080P")}
                        className="w-full bg-surface text-on-surface border border-primary/20 font-mono text-[10px] px-2 py-1.5 focus:border-secondary focus:outline-none rounded-none cursor-pointer"
                      >
                        <option value="4K">4K UHD (3840)</option>
                        <option value="2K">2K QHD (2560)</option>
                        <option value="1080P">Full HD (1920)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadPinAsset(selectedPin.url, selectedPin.title, downloadFormat, downloadRes)}
                    disabled={isDownloading}
                    className="w-full bg-primary hover:bg-secondary text-on-primary py-2.5 px-3 font-mono text-[9px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 rounded-none"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>EXPORT HIGH-RES STREAM PIN</span>
                  </button>
                </div>

                {/* Comment Logger Section */}
                <div className="border-t border-primary/10 pt-4 mt-2 flex-grow flex flex-col justify-between">
                  <div>
                    <h6 className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-3">
                      <MessageSquare className="w-3.5 h-3.5 text-secondary" />
                      <span>Comments Log ({(pinComments[selectedPin.id] || []).length})</span>
                    </h6>

                    <div className="space-y-3.5 max-h-[160px] overflow-y-auto pr-1 mb-4">
                      {(pinComments[selectedPin.id] || []).map((com: any) => (
                        <div key={com.id} className="text-xs space-y-0.5 bg-[#fcfbfa]/60 dark:bg-[#121826]/10 p-2.5 border border-primary/5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-black text-primary text-[10px] leading-none">
                              {com.author}
                            </span>
                            <span className="font-mono text-[8px] text-on-surface-variant/80">
                              {com.timestamp}
                            </span>
                          </div>
                          <p className="text-on-surface-variant leading-relaxed font-sans text-[11px]">
                            {com.text}
                          </p>
                        </div>
                      ))}
                      {(pinComments[selectedPin.id] || []).length === 0 && (
                        <p className="text-[10px] font-mono italic text-on-surface-variant/70 text-center py-4">
                          No comment signatures left on this stream block. Leave yours below!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add Comment Input Fields */}
                  <form onSubmit={(e) => handleCommentSubmit(e, selectedPin.id)} className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Alias (Optional)"
                        value={newCommentName}
                        onChange={(e) => setNewCommentName(e.target.value)}
                        className="bg-surface text-on-surface border border-primary/20 font-mono text-[10px] px-2 py-1.5 focus:border-secondary focus:outline-none rounded-none w-full"
                      />
                      <span className="text-[8px] font-mono text-on-surface-variant/75 flex items-center justify-end uppercase font-black">
                        RAM EPHEMERAL STATE
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Type a comment to sync on this pin board..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="bg-surface text-on-surface border border-primary/20 font-sans text-xs px-3 py-2 focus:border-secondary focus:outline-none rounded-none flex-grow"
                      />
                      <button
                        type="submit"
                        className="bg-primary text-on-primary hover:bg-secondary p-2 rounded-none cursor-pointer flex items-center justify-center transition-colors"
                        title="Submit Comment"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>

                {/* Similar Pins Recommendation strip */}
                {similarPins.length > 0 && (
                  <div className="border-t border-primary/10 pt-4 mt-4">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-secondary block mb-2">
                      MORE LIKE THIS
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {similarPins.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleOpenPin(item)}
                          className="aspect-video relative overflow-hidden bg-neutral-900 border border-primary/10 hover:border-secondary cursor-pointer"
                        >
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-full object-cover select-none"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-neutral-950/20 hover:bg-neutral-950/0 transition-colors flex items-end p-1.5">
                            <span className="text-[8px] font-mono text-white truncate w-full font-bold bg-neutral-950/70 px-1 py-0.5">
                              {item.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Slide-over Contact drawer for enterprise inquiries */}
      <AnimatePresence>
        {showContactDrawer && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="bg-surface border-l border-primary max-w-md w-full h-full p-6 flex flex-col justify-between shadow-[-6px_0px_12px_rgba(0,0,0,0.15)] relative"
            >
              <button
                type="button"
                onClick={() => setShowContactDrawer(false)}
                className="absolute top-4 right-4 p-2 bg-background hover:bg-primary hover:text-on-primary border border-primary/15 hover:border-primary transition-all cursor-pointer rounded-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-6 flex-grow overflow-y-auto pr-1">
                <div className="border-b border-primary/20 pb-4 mt-6">
                  <div className="flex items-center gap-2 text-secondary">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <h3 className="font-serif font-bold text-lg uppercase text-primary tracking-tight">
                      Enterprise Pipeline
                    </h3>
                  </div>
                  <p className="text-[9px] font-mono uppercase text-on-surface-variant mt-0.5 tracking-wider font-bold">
                    INQUIRY FORM DIRECT SYNC TO FIRESTORE
                  </p>
                </div>

                {formStatus !== "success" ? (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-primary">
                        Full Name / Company
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Liam Vance"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className={`w-full bg-background border rounded-none p-3 font-mono text-xs focus:outline-none focus:border-secondary transition-colors ${
                          formErrors.name ? "border-rose-800" : "border-primary/20"
                        }`}
                      />
                      {formErrors.name && (
                        <span className="text-[9px] font-mono text-rose-800 block">{formErrors.name}</span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-primary">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. liam@domain.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className={`w-full bg-background border rounded-none p-3 font-mono text-xs focus:outline-none focus:border-secondary transition-colors ${
                          formErrors.email ? "border-rose-800" : "border-primary/20"
                        }`}
                      />
                      {formErrors.email && (
                        <span className="text-[9px] font-mono text-rose-800 block">{formErrors.email}</span>
                      )}
                    </div>

                    {/* Subject */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-primary">
                        Subject Matter
                      </label>
                      <select
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        className="w-full bg-background border border-primary/20 rounded-none p-3 font-mono text-xs focus:outline-none focus:border-secondary cursor-pointer"
                      >
                        <option value="API Ingestion Integration">Custom API Ingestion Pipeline</option>
                        <option value="High-Fidelity Encoding">Fidelity Rescale Encoding</option>
                        <option value="Enterprise Team Licensing">Enterprise Workspace Sync</option>
                        <option value="Other Inquiries">General Technical Inquiries</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-primary">
                        Message Inquiry
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Specify your pipeline requirements, expected streaming bandwidth, or question..."
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        className={`w-full bg-background border rounded-none p-3 font-mono text-xs focus:outline-none focus:border-secondary transition-colors resize-none ${
                          formErrors.message ? "border-rose-800" : "border-primary/20"
                        }`}
                      />
                      {formErrors.message && (
                        <span className="text-[9px] font-mono text-rose-800 block">{formErrors.message}</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={formStatus === "submitting"}
                      className="w-full bg-primary hover:bg-secondary text-on-primary py-3.5 px-6 rounded-none font-mono font-black text-[10px] tracking-widest uppercase cursor-pointer transition-all flex justify-center items-center gap-2 shadow-[3px_3px_0px_#1b222c]"
                    >
                      {formStatus === "submitting" ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>TRANSMITTING INQUIRY...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>SUBMIT SECURE INQUIRY</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center justify-center space-y-6 text-center"
                  >
                    <div className="p-4 bg-emerald-50 border border-emerald-500/25 text-emerald-700 rounded-full animate-bounce">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-serif font-normal text-xl text-primary">Message Synced!</h4>
                      <p className="text-xs font-mono text-on-surface-variant leading-relaxed max-w-xs mx-auto">
                        Inquiry on <span className="text-secondary font-bold">{contactSubject}</span> written safely to Firestore. An operator will contact you at <span className="font-bold">{contactEmail}</span>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetContactForm}
                      className="px-4 py-2 bg-primary hover:bg-secondary text-on-primary font-mono text-[9px] font-black tracking-wider uppercase rounded-none cursor-pointer"
                    >
                      SUBMIT NEW MESSAGE
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="pt-4 border-t border-primary/10 mt-4 text-center">
                <span className="text-[8px] font-mono text-on-surface-variant/80 block uppercase tracking-widest">
                  Secure Socket Layer Encrypted
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
