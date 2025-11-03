import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VideoLibraryPage } from "./pages/VideoLibraryPage";
import { VideoDetailPage } from "./pages/VideoDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VideoLibraryPage />} />
        <Route path="/videos/:id" element={<VideoDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
