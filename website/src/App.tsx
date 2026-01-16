import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import GetStarted from './pages/GetStarted';
import HelpSafety from './pages/HelpSafety';
import Documentation from './pages/Documentation';
import Status from './pages/Status';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="get-started" element={<GetStarted />} />
        <Route path="help" element={<HelpSafety />} />
        <Route path="docs" element={<Documentation />} />
        <Route path="status" element={<Status />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
      </Route>
    </Routes>
  );
}
