import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Tabs,
  Tab,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

const EventDashboard = () => {
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [aiInsights, setAiInsights] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("search");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventsRes, analyticsRes] = await Promise.all([
        api.get("/events"),
        api.get("/events/analytics"),
      ]);

      setEvents(eventsRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/events/search?query=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(response.data.data);
      setAiInsights(response.data.aiInsights);
    } catch (error) {
      console.error("Error searching:", error);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderSearchSection = () => (
    <div>
      <Form onSubmit={handleSearch}>
        <Row className="mb-4">
          <Col md={10}>
            <Form.Control
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              disabled={loading}
            />
          </Col>
          <Col md={2}>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-100"
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </Col>
        </Row>
      </Form>

      {aiInsights && (
        <Alert variant="info" className="mb-4">
          <Alert.Heading>AI Analysis</Alert.Heading>
          <p>{aiInsights}</p>
        </Alert>
      )}

      {searchResults.length > 0
        ? searchResults.map((event, index) => (
            <Card key={index} className="mb-3">
              <Card.Body>
                <Card.Title>{event.Otsikko}</Card.Title>
                <Card.Text className="text-muted mb-3">
                  {event.Tiivistelmä}
                </Card.Text>
                <div className="mb-2">
                  {event.Aiheet?.split(",").map((topic, i) => (
                    <Badge bg="secondary" className="me-2 mb-2" key={i}>
                      {topic.trim()}
                    </Badge>
                  ))}
                </div>
                {event.Tapahtumapaikan_nimi && (
                  <div className="text-muted">
                    <small>
                      <i className="bi bi-geo-alt"></i>{" "}
                      {event.Tapahtumapaikan_nimi}
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))
        : searchQuery &&
          !loading && (
            <Alert variant="warning">
              No events found matching your search criteria.
            </Alert>
          )}
    </div>
  );

  const renderAnalyticsSection = () => {
    if (!analytics) return null;

    const themeData = Object.entries(analytics.themeAnalysis || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return (
      <div>
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>AI Analysis & Recommendations</Card.Title>
            <Alert variant="success" className="mb-3">
              <Alert.Heading>Analysis</Alert.Heading>
              <p>{analytics.aiAnalysis}</p>
            </Alert>
            <Alert variant="primary">
              <Alert.Heading>Recommendations</Alert.Heading>
              <p>{analytics.aiRecommendations}</p>
            </Alert>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <Card.Title>Top 10 Event Themes</Card.Title>
            <div className="mt-4" style={{ overflowX: "auto" }}>
              <BarChart width={800} height={400} data={themeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0d6efd" name="Number of Events" />
              </BarChart>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  return (
    <Container className="mb-5">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="search" title="Search Events">
          {renderSearchSection()}
        </Tab>
        <Tab eventKey="analytics" title="Analytics">
          {renderAnalyticsSection()}
        </Tab>
      </Tabs>

      {loading && !searchResults.length && (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}
    </Container>
  );
};

export default EventDashboard;

// // components/EventDashboard.jsx
// import { useState, useEffect } from "react";
// import {
//   Container,
//   Row,
//   Col,
//   Form,
//   Button,
//   Card,
//   Tabs,
//   Tab,
//   Badge,
//   Spinner,
//   Alert,
// } from "react-bootstrap";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
// } from "recharts";
// import axios from "axios";

// const EventDashboard = () => {
//   const [events, setEvents] = useState([]);
//   const [analytics, setAnalytics] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [aiInsights, setAiInsights] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("search");

//   useEffect(() => {
//     fetchInitialData();
//   }, []);

//   const fetchInitialData = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const [eventsRes, analyticsRes] = await Promise.all([
//         api.get("/events"),
//         api.get("/events/analytics"),
//       ]);

//       setEvents(eventsRes.data.data);
//       setAnalytics(analyticsRes.data.data);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setError("Failed to load data. Please try again later.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     if (!searchQuery.trim()) return;

//     try {
//       setLoading(true);
//       setError(null);
//       const response = await api.get(
//         `/events/search?query=${encodeURIComponent(searchQuery)}`
//       );
//       setSearchResults(response.data.data);
//       setAiInsights(response.data.aiInsights);
//     } catch (error) {
//       console.error("Error searching:", error);
//       setError("Search failed. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderSearchSection = () => (
//     <div>
//       <Form className="mb-4">
//         <Row>
//           <Col md={10}>
//             <Form.Control
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search events..."
//               onKeyPress={(e) => e.key === "Enter" && handleSearch()}
//             />
//           </Col>
//           <Col md={2}>
//             <Button
//               variant="primary"
//               onClick={handleSearch}
//               disabled={loading}
//               className="w-100"
//             >
//               {loading ? (
//                 <>
//                   <Spinner
//                     as="span"
//                     animation="border"
//                     size="sm"
//                     role="status"
//                     aria-hidden="true"
//                     className="me-2"
//                   />
//                   Searching...
//                 </>
//               ) : (
//                 "Search"
//               )}
//             </Button>
//           </Col>
//         </Row>
//       </Form>

//       {aiInsights && (
//         <Alert variant="info" className="mb-4">
//           <Alert.Heading>AI Analysis</Alert.Heading>
//           <p>{aiInsights}</p>
//         </Alert>
//       )}

//       {searchResults.map((event, index) => (
//         <Card key={index} className="mb-3">
//           <Card.Body>
//             <Card.Title>{event.Otsikko}</Card.Title>
//             <Card.Text className="text-muted">{event.Tiivistelmä}</Card.Text>
//             <div>
//               {event.Aiheet?.split(",").map((topic, i) => (
//                 <Badge bg="secondary" className="me-2" key={i}>
//                   {topic.trim()}
//                 </Badge>
//               ))}
//             </div>
//           </Card.Body>
//         </Card>
//       ))}
//     </div>
//   );

//   const renderAnalyticsSection = () => {
//     if (!analytics) return null;

//     const themeData = Object.entries(analytics.themeAnalysis)
//       .map(([name, value]) => ({ name, value }))
//       .sort((a, b) => b.value - a.value)
//       .slice(0, 10);

//     return (
//       <div>
//         <Card className="mb-4">
//           <Card.Body>
//             <Card.Title>AI Analysis & Recommendations</Card.Title>
//             <Alert variant="success" className="mb-3">
//               <Alert.Heading>Analysis</Alert.Heading>
//               <p>{analytics.aiAnalysis}</p>
//             </Alert>
//             <Alert variant="primary">
//               <Alert.Heading>Recommendations</Alert.Heading>
//               <p>{analytics.aiRecommendations}</p>
//             </Alert>
//           </Card.Body>
//         </Card>

//         <Card>
//           <Card.Body>
//             <Card.Title>Top 10 Event Themes</Card.Title>
//             <div className="mt-4" style={{ overflowX: "auto" }}>
//               <BarChart width={800} height={400} data={themeData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis
//                   dataKey="name"
//                   angle={-45}
//                   textAnchor="end"
//                   height={100}
//                 />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Bar dataKey="value" fill="#0d6efd" />
//               </BarChart>
//             </div>
//           </Card.Body>
//         </Card>
//       </div>
//     );
//   };

//   if (loading && !events.length) {
//     return (
//       <div className="text-center my-5">
//         <Spinner animation="border" role="status">
//           <span className="visually-hidden">Loading...</span>
//         </Spinner>
//       </div>
//     );
//   }

//   return (
//     <Container className="mb-5">
//       <Tabs
//         activeKey={activeTab}
//         onSelect={(k) => setActiveTab(k)}
//         className="mb-4"
//       >
//         <Tab eventKey="search" title="Search Events">
//           {renderSearchSection()}
//         </Tab>
//         <Tab eventKey="analytics" title="Analytics">
//           {renderAnalyticsSection()}
//         </Tab>
//       </Tabs>
//     </Container>
//   );
// };

// export default EventDashboard;
