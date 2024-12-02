import { useState } from "react";
import axios from "axios";
import { Container, Card, Form, Button, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const ChatComponent = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: input }],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessages((prev) => [
        ...prev,
        { role: "user", content: input },
        {
          role: "assistant",
          content: response.data.choices[0].message.content,
        },
      ]);
      setInput("");
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert("Error occurred while fetching response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card style={{ maxWidth: "800px" }} className="mx-auto">
        <Card.Header>
          <Card.Title className="mb-0">OpenAI Chat Test</Card.Title>
        </Card.Header>
        <Card.Body>
          <div
            className="mb-3"
            style={{
              height: "400px",
              overflowY: "auto",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
              padding: "1rem",
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-2 mb-2 rounded ${
                  message.role === "user"
                    ? "bg-primary text-white ms-auto"
                    : "bg-light"
                }`}
                style={{
                  maxWidth: "80%",
                  width: "fit-content",
                  marginLeft: message.role === "user" ? "auto" : "0",
                }}
              >
                {message.content}
              </div>
            ))}
          </div>

          <Form onSubmit={handleSubmit} className="d-flex gap-2">
            <Form.Control
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
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
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ChatComponent;
