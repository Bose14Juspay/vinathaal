
// Mock function to simulate fetching Anna University syllabus
// In a real implementation, this would integrate with an API or database
export const fetchAnnaSyllabus = async (subjectCode: string, subjectName: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock syllabus content based on common Anna University subjects
  const mockSyllabusData: Record<string, string> = {
    'CS8493': `UNIT I - INTRODUCTION TO OPERATING SYSTEMS
Process concept, Process scheduling, Inter-process communication, Threads, CPU scheduling algorithms.

UNIT II - PROCESS SYNCHRONIZATION 
Critical section problem, Semaphores, Monitors, Deadlock handling, Prevention and avoidance.

UNIT III - MEMORY MANAGEMENT
Contiguous memory allocation, Paging, Segmentation, Virtual memory, Page replacement algorithms.

UNIT IV - FILE SYSTEMS
File system interface, File system implementation, Directory structure, File allocation methods.

UNIT V - I/O SYSTEMS AND SECURITY
I/O hardware, I/O software layers, Disk scheduling, Security threats, Authentication mechanisms.`,

    'CS8491': `UNIT I - INTRODUCTION TO COMPUTER NETWORKS
Network models, Protocol layering, Internet protocol stack, Network applications.

UNIT II - APPLICATION LAYER
HTTP, FTP, SMTP, DNS, Socket programming, Web applications.

UNIT III - TRANSPORT LAYER
UDP, TCP, Reliable data transfer, Flow control, Congestion control.

UNIT IV - NETWORK LAYER
IP addressing, Routing algorithms, Internet routing protocols, IPv6.

UNIT V - DATA LINK AND PHYSICAL LAYER
Error detection and correction, Multiple access protocols, Ethernet, Wireless networks.`,

    'CS8451': `UNIT I - ALGORITHM ANALYSIS
Asymptotic notation, Recurrence relations, Master theorem, Performance analysis.

UNIT II - DIVIDE AND CONQUER
Merge sort, Quick sort, Binary search, Maximum subarray problem.

UNIT III - GREEDY ALGORITHMS
Activity selection, Fractional knapsack, Huffman coding, Minimum spanning tree.

UNIT IV - DYNAMIC PROGRAMMING
Optimal substructure, Overlapping subproblems, 0/1 knapsack, Longest common subsequence.

UNIT V - GRAPH ALGORITHMS
Graph traversal (BFS, DFS), Shortest path algorithms, Network flow problems.`
  };

  // Return mock data or generate generic content
  if (mockSyllabusData[subjectCode]) {
    return mockSyllabusData[subjectCode];
  }

  // Generate generic syllabus if subject code not found
  return `UNIT I - INTRODUCTION TO ${subjectName.toUpperCase()}
Fundamental concepts, Basic principles, Historical development, Core theories.

UNIT II - THEORETICAL FOUNDATIONS
Mathematical foundations, Key algorithms, Problem-solving approaches, Analysis methods.

UNIT III - PRACTICAL APPLICATIONS
Implementation strategies, Case studies, Real-world applications, Design patterns.

UNIT IV - ADVANCED CONCEPTS
Advanced techniques, Optimization methods, Performance considerations, Best practices.

UNIT V - CURRENT TRENDS AND FUTURE DIRECTIONS
Emerging technologies, Research trends, Future developments, Industry applications.`;
};

export const parseSyllabusUnits = (syllabusText: string): Record<string, string[]> => {
  const units: Record<string, string[]> = {};
  const unitPattern = /UNIT ([IVX]+) - (.+?)(?=UNIT [IVX]+|$)/gs;
  let match;

  while ((match = unitPattern.exec(syllabusText)) !== null) {
    const unitNumber = match[1];
    const unitContent = match[2].trim();
    
    // Extract topics from unit content
    const topics = unitContent
      .split(/[,.\n]/)
      .map(topic => topic.trim())
      .filter(topic => topic.length > 5 && !topic.match(/^UNIT/))
      .slice(0, 8); // Limit to 8 topics per unit

    units[`unit${convertRomanToNumber(unitNumber)}`] = topics;
  }

  return units;
};

const convertRomanToNumber = (roman: string): number => {
  const romanMap: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5 };
  return romanMap[roman] || 1;
};
