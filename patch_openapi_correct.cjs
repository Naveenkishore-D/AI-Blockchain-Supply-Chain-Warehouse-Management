const fs = require('fs');

let openapiCode = fs.readFileSync('src/openapi.ts', 'utf-8');

const queryParams = `
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number for pagination" },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Number of items per page" },
          { name: "sortBy", in: "query", schema: { type: "string" }, description: "Field to sort by" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] }, description: "Sort direction" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search term" },
          { name: "category", in: "query", schema: { type: "string" }, description: "Filter by category" }
        ],`;

openapiCode = openapiCode.replace(
  'description: "Queries active counts across all categories and warehouse bins.",\n        responses:',
  'description: "Queries active counts across all categories and warehouse bins.",' + queryParams + '\n        responses:'
);

openapiCode = openapiCode.replace(
  /responses: {\s+"200": {\s+description: "Success.",\s+content: {\s+"application\/json": {\s+schema: {\s+type: "array",\s+items: {\s+\$ref: "#\/components\/schemas\/InventoryItem"\s+}\s+}\s+}\s+}\s+}/,
  `responses: {
          "200": {
            description: "A list of inventory items.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total: { type: "integer" },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    totalPages: { type: "integer" },
                    data: { type: "array", items: { $ref: "#/components/schemas/InventoryItem" } }
                  }
                }
              }
            }
          }
        }`
);

// Supplier pagination
openapiCode = openapiCode.replace(
  'description: "Queries the secure registry of authorized suppliers.",\n        responses:',
  'description: "Queries the secure registry of authorized suppliers.",' + queryParams + '\n        responses:'
);

openapiCode = openapiCode.replace(
  /responses: {\s+"200": {\s+description: "Success.",\s+content: {\s+"application\/json": {\s+schema: {\s+type: "array",\s+items: {\s+\$ref: "#\/components\/schemas\/Supplier"\s+}\s+}\s+}\s+}\s+}/,
  `responses: {
          "200": {
            description: "A list of suppliers.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total: { type: "integer" },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    totalPages: { type: "integer" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Supplier" } }
                  }
                }
              }
            }
          }
        }`
);

fs.writeFileSync('src/openapi.ts', openapiCode);
console.log("Patched src/openapi.ts correctly");
