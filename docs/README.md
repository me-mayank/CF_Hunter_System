# Hunter Engine API Documentation

This directory contains the OpenAPI 3.0 specification for the Hunter Engine backend.

## Viewing the Docs

When the server is running, the interactive Swagger UI is automatically hosted at:
[http://localhost:3000/docs](http://localhost:3000/docs)

*(Note: If you run the server on a different port, substitute 3000 with your configured `PORT`)*

## Updating the Specification

The API is documented in `swagger.json`. Since this backend uses pure Node.js and Express without a framework-level auto-generator (like NestJS or tsoa), the specification must be updated manually when routes change.

To update the docs:
1. Open `docs/swagger.json`.
2. Locate the route or component schema you modified.
3. Update the JSON according to the OpenAPI 3.0 specification.
4. Restart the development server (`npm run dev`) to see the changes reflected at `/docs`.

## SSE Endpoint Notes
The `/hunter/{handle}/events` endpoint is a Server-Sent Events (SSE) stream. Swagger UI does not natively support rendering live event streams well. You can view its documentation in the UI, but it is best tested using `curl` or a dedicated SSE client:
```bash
curl -N http://localhost:3000/hunter/tourist/events
```
