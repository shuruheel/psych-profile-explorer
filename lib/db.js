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
      return mapNodeToProfile(node.properties);
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
 * Note: This application uses Neo4j for data storage rather than Prisma.
 * If you need to create profiles, implement a Neo4j-specific creation function here.
 */

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
         LIMIT 1000`
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