import React from "react";

const SupportPage = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-2xl font-bold">Support Tickets</h2>
        <p className="text-muted-foreground max-w-md">
          Select a ticket from the list to view details and replies, or create a new ticket if you need help.
        </p>
      </div>
    </div>
  );
};

export default SupportPage;
