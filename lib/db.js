import neo4j from 'neo4j-driver';

// Initialize Neo4j Driver
let driver;

/**
 * Parse a string-encoded JSON field safely
 * @param {string} value - The string value to parse
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} Parsed object or default value
 */
function safeParseJson(value, defaultValue) {
  if (!value) return defaultValue;
  
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Get Neo4j driver instance
 * @returns {Promise<neo4j.Driver>} Neo4j driver instance
 */
export function getDriver() {
  if (driver) {
    return driver;
  }

  // Get credentials from environment variables
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME || process.env.NEO4J_USER; // Support both variable names
  const password = process.env.NEO4J_PASSWORD;

  // Validate environment variables
  if (!uri || !username || !password) {
    console.error('Missing Neo4j credentials. Please check your environment variables.');
    throw new Error('Missing Neo4j credentials');
  }

  try {
    // Create a new driver instance
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 30000
    });
    
    return driver;
  } catch (error) {
    console.error('Error connecting to Neo4j:', error);
    throw new Error('Failed to connect to Neo4j database');
  }
}

/**
 * Close the Neo4j driver
 */
export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/**
 * Map Neo4j node properties to profile object with proper parsing
 * @param {object} properties - Node properties from Neo4j
 * @returns {object} Formatted profile object
 */
function mapNodeToProfile(properties) {
  // Default empty values
  const emptyArray = [];
  const emptyObject = {};
  
  return {
    name: properties.name || '',
    nodeType: properties.nodeType || '',
    subType: properties.subType || '',
    biography: properties.biography || '',
    aliases: properties.aliases || emptyArray,
    personalityTraits: safeParseJson(properties.personalityTraits, emptyArray),
    cognitiveStyle: safeParseJson(properties.cognitiveStyle, emptyObject),
    emotionalProfile: safeParseJson(properties.emotionalProfile, emptyObject),
    relationalDynamics: safeParseJson(properties.relationalDynamics, emptyObject),
    valueSystem: safeParseJson(properties.valueSystem, emptyObject),
    psychologicalDevelopment: safeParseJson(properties.psychologicalDevelopment, emptyArray),
    
    // Handle missing fields with defaults
    metaAttributes: properties.metaAttributes ? 
      safeParseJson(properties.metaAttributes, {
        authorBias: 0,
        portrayalConsistency: 0,
        controversialAspects: []
      }) : {
        authorBias: 0,
        portrayalConsistency: 0,
        controversialAspects: []
      },
      
    // Map confidence fields
    modelConfidence: properties.modelConfidence || properties.confidence || 0,
    evidenceStrength: properties.evidenceStrength || 0.5,
    
    // Additional fields
    description: properties.description || '',
    keyContributions: safeParseJson(properties.keyContributions, emptyArray),
    observations: properties.observations || '',
    emotionalValence: properties.emotionalValence || 0,
    emotionalArousal: properties.emotionalArousal || 0,
    personalitySummary: properties.personalitySummary || '',
    decisionMaking: properties.decisionMaking || '',
    emotionalDisposition: properties.emotionalDisposition || '',
    interpersonalStyle: properties.interpersonalStyle || '',
    ethicalFramework: properties.ethicalFramework || '',
    source: properties.source || '',
    confidence: properties.confidence || 0
  };
}

/**
 * Get all psychological profiles (limited to 100)
 * @returns {Promise<Array>} Array of profile objects
 */
export async function getProfiles() {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (e:Entity) 
       WHERE e.nodeType = 'Entity' AND e.subType = 'Person'
       RETURN e
       LIMIT 100`
    );
    
    return result.records.map(record => {
      const node = record.get('e');
      return mapNodeToProfile(node.properties);
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  } finally {
    await session.close();
  }
}

/**
 * Get a profile by name
 * @param {string} name - The name of the profile to get
 * @returns {Promise<Object|null>} The profile object or null if not found
 */
export async function getProfileByName(name) {
  try {
    console.log(`Getting profile for name: ${name}`);
    const driver = getDriver();
    console.log('Creating Neo4j session for profile lookup...');
    const session = driver.session();
    
    try {
      console.log(`Executing Neo4j query to find profile: ${name}`);
      const result = await session.run(
        `MATCH (e:Entity {name: $name}) 
         RETURN e`,
        { name }
      );
      
      if (result.records.length === 0) {
        console.log(`No profile found with name: ${name}`);
        return null;
      }
      
      console.log(`Profile found for: ${name}`);
      const node = result.records[0].get('e');
      
      // Log all properties for debugging
      console.log(`Profile properties for ${name}:`, Object.keys(node.properties));
      
      try {
        const mappedProfile = mapNodeToProfile(node.properties);
        console.log(`Profile successfully mapped for: ${name}`);
        return mappedProfile;
      } catch (error) {
        console.error(`Error mapping profile for ${name}:`, error);
        console.error(`Profile mapping error stack: ${error.stack}`);
        // Return a simplified profile object if mapping fails
        return {
          name: node.properties.name || name,
          nodeType: node.properties.nodeType || 'Entity',
          subType: node.properties.subType || 'Person',
          biography: node.properties.biography || `Profile for ${name}`,
          error: `Error mapping profile: ${error.message}`
        };
      }
    } catch (error) {
      console.error(`Error executing Neo4j query for ${name}:`, error);
      return null;
    } finally {
      await session.close();
      console.log('Neo4j session closed for profile lookup');
    }
  } catch (error) {
    console.error(`Error in getProfileByName for ${name}:`, error);
    return null;
  }
}

/**
 * Get just the names of psychological profiles (limited to 100)
 * Lightweight version for dropdowns/lists
 * @returns {Promise<Array>} Array of minimal profile data (name only)
 */
export async function getProfileNames() {
  try {
    console.log('Getting Neo4j driver...');
    const driver = getDriver();
    console.log('Creating Neo4j session...');
    const session = driver.session();
    
    try {
      console.log('Executing Neo4j query...');
      const result = await session.run(
        `MATCH (e:Entity) 
         WHERE e.nodeType = 'Entity' AND e.subType = 'Person'
         RETURN e.name
         LIMIT 2000`
      );
      
      console.log(`Query completed, found ${result.records.length} profiles`);
      return result.records.map(record => {
        const name = record.get('e.name');
        return { name };
      });
    } catch (error) {
      console.error('Error executing Neo4j query:', error);
      return [];
    } finally {
      await session.close();
      console.log('Neo4j session closed');
    }
  } catch (error) {
    console.error('Error in getProfileNames:', error);
    return [];
  }
}

/**
 * Map Neo4j node properties to a reasoning step object with proper parsing
 * @param {object} properties - Node properties from Neo4j
 * @returns {object} Formatted reasoning step object
 */
function mapNodeToReasoningStep(properties) {
  // Helper function to parse array fields safely
  const safeParseArray = (value) => {
    if (!value) return [];
    
    // If already an array, return it
    if (Array.isArray(value)) return value;
    
    // If a string, try to parse as JSON
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch (error) {
        // If parsing fails, split by semicolon or comma if those exist
        if (value.includes(';')) {
          return value.split(';').map(item => item.trim());
        } else if (value.includes(',')) {
          return value.split(',').map(item => item.trim());
        }
        // Otherwise treat as a single-item array
        return [value];
      }
    }
    
    // For any other case
    return [String(value)];
  };
  
  return {
    name: properties.name || '',
    nodeType: properties.nodeType || 'ReasoningStep',
    content: properties.content || '',
    stepType: properties.stepType || '',
    evidenceType: properties.evidenceType || '',
    supportingReferences: safeParseArray(properties.supportingReferences),
    confidence: properties.confidence || 0,
    alternatives: safeParseArray(properties.alternatives),
    counterarguments: safeParseArray(properties.counterarguments),
    assumptions: safeParseArray(properties.assumptions),
    formalNotation: properties.formalNotation || '',
    order: properties.order || 0
  };
}

/**
 * Map Neo4j node properties to a reasoning chain object with proper parsing
 * @param {object} properties - Node properties from Neo4j
 * @returns {object} Formatted reasoning chain object
 */
function mapNodeToReasoningChain(properties) {
  // Default empty values
  const emptyArray = [];
  
  // Helper function to parse array fields safely
  const safeParseArray = (value) => {
    if (!value) return emptyArray;
    
    // If already an array, return it
    if (Array.isArray(value)) return value;
    
    // If a string, try to parse as JSON
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch (error) {
        // If parsing fails, split by semicolon or comma if those exist
        if (value.includes(';')) {
          return value.split(';').map(item => item.trim());
        } else if (value.includes(',')) {
          return value.split(',').map(item => item.trim());
        }
        // Otherwise treat as a single-item array
        return [value];
      }
    }
    
    // For any other case
    return [String(value)];
  };

  // Parse steps into usable formats if they exist - but exclude stepDetails
  let parsedSteps = [];
  if (properties.steps) {
    parsedSteps = safeParseArray(properties.steps);
  }
  
  return {
    name: properties.name || '',
    nodeType: properties.nodeType || 'ReasoningChain',
    description: properties.description || '',
    conclusion: properties.conclusion || '',
    confidenceScore: properties.confidenceScore || 0,
    creator: properties.creator || '',
    methodology: properties.methodology || '',
    domain: properties.domain || '',
    numberOfSteps: properties.numberOfSteps || 0,
    alternativeConclusionsConsidered: safeParseArray(properties.alternativeConclusionsConsidered),
    steps: parsedSteps
  };
}

/**
 * Get reasoning chains related to a profile by name
 * @param {string} profileName - The name of the profile to get reasoning chains for
 * @returns {Promise<Array<Object>>} Array of reasoning chain objects with their steps
 */
export async function getReasoningChainsByProfileName(profileName) {
  try {
    console.log(`Getting reasoning chains for profile: ${profileName}`);
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const result = await session.run(
        `MATCH (e:Entity {name: $profileName})-[r]-(rc:ReasoningChain)
         RETURN rc
         LIMIT 3`,
        { profileName }
      );
      
      if (result.records.length === 0) {
        console.log(`No reasoning chains found related to: ${profileName}`);
        return [];
      }
      
      console.log(`Found ${result.records.length} reasoning chains related to: ${profileName}`);
      
      // Map chains to objects
      const chains = result.records.map(record => {
        const node = record.get('rc');
        return mapNodeToReasoningChain(node.properties);
      });
      
      // Close the session since we're done with it
      await session.close();
      
      // Create an array of promises to fetch reasoning steps for each chain
      const chainStepPromises = chains.map(chain => getReasoningStepsByChainName(chain.name));
      
      // Wait for all reasoning step queries to complete in parallel
      const allSteps = await Promise.all(chainStepPromises);
      
      // Combine chains with their steps
      const chainsWithSteps = chains.map((chain, index) => ({
        ...chain,
        reasoningSteps: allSteps[index] || []
      }));
      
      return chainsWithSteps;
    } catch (error) {
      console.error(`Error executing Neo4j query for reasoning chains of ${profileName}:`, error);
      await session.close();
      return [];
    }
  } catch (error) {
    console.error(`Error in getReasoningChainsByProfileName for ${profileName}:`, error);
    return [];
  }
}

/**
 * Get reasoning steps for a specific reasoning chain by name
 * @param {string} chainName - The name of the reasoning chain
 * @returns {Promise<Array<Object>>} Array of reasoning step objects
 */
export async function getReasoningStepsByChainName(chainName) {
  try {
    console.log(`Getting reasoning steps for chain: ${chainName}`);
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const result = await session.run(
        `MATCH (rs:ReasoningStep {chainName: $chainName})
         RETURN rs
         ORDER BY rs.order`,
        { chainName }
      );
      
      if (result.records.length === 0) {
        console.log(`No reasoning steps found for chain: ${chainName}`);
        return [];
      }
      
      console.log(`Found ${result.records.length} reasoning steps for chain: ${chainName}`);
      return result.records.map(record => {
        const node = record.get('rs');
        return mapNodeToReasoningStep(node.properties);
      });
    } catch (error) {
      console.error(`Error executing Neo4j query for reasoning steps of ${chainName}:`, error);
      return [];
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error(`Error in getReasoningStepsByChainName for ${chainName}:`, error);
    return [];
  }
}

/**
 * Execute a custom Cypher query
 * @param {string} query - The Cypher query to execute
 * @param {object} params - Parameters for the query
 * @returns {Promise<Array>} Query results
 */
export async function executeCypherQuery(query, params = {}) {
  try {
    console.log(`Executing custom Cypher query: ${query.substring(0, 100)}...`);
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const result = await session.run(query, params);
      
      console.log(`Query executed, returned ${result.records.length} records`);
      return result.records.map(record => {
        // Convert Neo4j record to a plain object
        const obj = {};
        for (const key of record.keys) {
          const value = record.get(key);
          
          // Handle Neo4j Node objects
          if (value && value.properties) {
            obj[key] = {
              ...value.properties,
              labels: value.labels,
              identity: value.identity
            };
          } else {
            obj[key] = value;
          }
        }
        return obj;
      });
    } catch (error) {
      console.error(`Error executing Cypher query:`, error);
      return [];
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error(`Error in executeCypherQuery:`, error);
    return [];
  }
}

