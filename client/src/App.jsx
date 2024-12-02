// App.jsx
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import EventDashboard from "./components/EventDashboard";

function App() {
  return (
    <div className="app">
      <header className="bg-dark text-white py-3 mb-4">
        <Container>
          <h1 className="h4 mb-0">Agricultural Events Analysis</h1>
        </Container>
      </header>

      <Container fluid="lg">
        <Row>
          <Col>
            <EventDashboard />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;
