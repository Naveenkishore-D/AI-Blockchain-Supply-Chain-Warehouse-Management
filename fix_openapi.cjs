const fs = require('fs');

let openapiCode = fs.readFileSync('src/openapi.ts', 'utf-8');

openapiCode = openapiCode.replace(
  `            }
          }
        }
        }
      },
      post: {
        summary: "Initialize an Inventory Stock",`,
  `            }
          }
        }
      },
      post: {
        summary: "Initialize an Inventory Stock",`
);

openapiCode = openapiCode.replace(
  `            }
          }
        }
        }
      },
      post: {
        summary: "Register a New Supplier",`,
  `            }
          }
        }
      },
      post: {
        summary: "Register a New Supplier",`
);


fs.writeFileSync('src/openapi.ts', openapiCode);
console.log("Fixed openapi.ts");
