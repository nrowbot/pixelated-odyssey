import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VideoLibraryPage } from "./pages/VideoLibraryPage";
import { VideoDetailPage } from "./pages/VideoDetailPage";
import { VideoUploadPage } from "./pages/VideoUploadPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VideoLibraryPage />} />
        <Route path="/videos/:id" element={<VideoDetailPage />} />
        <Route path="/upload" element={<VideoUploadPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
