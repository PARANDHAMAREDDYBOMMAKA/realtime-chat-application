"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <>
      <style jsx global>{`
        /* Fix scrolling and layout */
        html, body {
          height: 100%;
          overflow: auto !important;
          background: white !important;
        }

        /* Force light theme for Swagger UI */
        .swagger-ui {
          filter: none !important;
        }

        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 20px 0;
        }

        .swagger-ui .scheme-container {
          background: #fafafa;
          box-shadow: none;
          border: 1px solid #e5e5e5;
        }

        /* Light theme overrides */
        .swagger-ui .opblock-tag {
          border-bottom: 1px solid #e5e5e5;
        }

        .swagger-ui .opblock {
          background: white;
          border: 1px solid #e5e5e5;
        }

        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #61affe;
        }

        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #49cc90;
        }

        .swagger-ui .opblock.opblock-put .opblock-summary-method {
          background: #fca130;
        }

        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: #f93e3e;
        }

        .swagger-ui .btn.execute {
          background: #4990e2;
          border-color: #4990e2;
        }

        .swagger-ui .btn.execute:hover {
          background: #3270b8;
        }

        .swagger-ui .response-col_status {
          font-size: 14px;
        }

        .swagger-ui table {
          background: white;
        }

        /* Ensure proper scrolling */
        #__next {
          height: auto !important;
          min-height: 100%;
        }
      `}</style>

      <div className="w-full bg-white">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Converse API Documentation</h1>
            <p className="text-gray-600 text-lg">
              Complete interactive API documentation for Converse - Modern chat application with AI Assistant
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">REST API</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">AI-Powered</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">Real-time</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <SwaggerUI
              url="/api/docs"
              docExpansion="list"
              defaultModelsExpandDepth={1}
              displayRequestDuration={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}
