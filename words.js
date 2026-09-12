// Tech & IT Word Bank with descriptions for normal players and clever hints for imposters

export const TECH_WORDS = [
  {
    word: "API",
    category: "Software Development",
    description: "Application Programming Interface. An interface or contract that allows two software applications to communicate and exchange data with each other.",
    hint: "It acts as a messenger or bridge between different software services or apps."
  },
  {
    word: "Git",
    category: "Developer Tools",
    description: "A distributed version control system used by software developers to track code changes, manage source code history, and collaborate on projects.",
    hint: "It helps software engineers track changes, branch out code, and save history of their work."
  },
  {
    word: "Database",
    category: "Infrastructure & Data",
    description: "An organized, structured collection of data stored electronically in a computer system so it can be easily accessed, updated, and managed.",
    hint: "It stores large amounts of structured information like user profiles, transactions, and app records."
  },
  {
    word: "Bug",
    category: "Software Engineering",
    description: "An error, flaw, or unexpected behavior in a computer software program that causes it to produce incorrect results or crash.",
    hint: "It causes software to behave unexpectedly or fail, and developers spend hours trying to fix it."
  },
  {
    word: "Cache",
    category: "Performance & Storage",
    description: "A high-speed temporary data storage layer that stores a subset of data so future requests for that data are served faster.",
    hint: "It temporarily stores frequently accessed data so loading times are much quicker."
  },
  {
    word: "Cloud",
    category: "Infrastructure",
    description: "On-demand availability of computer system resources, especially data storage and computing power, over the internet without direct active management by the user.",
    hint: "It allows companies to host servers, databases, and services over the internet rather than on physical office hardware."
  },
  {
    word: "Docker",
    category: "DevOps & Containers",
    description: "A platform designed to build, run, and ship applications inside isolated environments called containers.",
    hint: "It packages applications into light, portable containers so they run consistently everywhere."
  },
  {
    word: "Firewall",
    category: "Cybersecurity",
    description: "A network security device or software that monitors and controls incoming and outgoing network traffic based on predetermined security rules.",
    hint: "It acts as a digital security guard protecting internal networks from unauthorized internet traffic."
  },
  {
    word: "Frontend",
    category: "Web Development",
    description: "The user-facing side of a website or web application that users directly see and interact with in their browsers.",
    hint: "It includes buttons, layouts, colors, and visuals that users see and tap on screen."
  },
  {
    word: "Pull Request",
    category: "Collaboration",
    description: "A submission of code changes by a developer to a shared repository, requesting teammates to review and merge the code.",
    hint: "It is a developer process where team members review and approve code changes before merging."
  },
  {
    word: "Kubernetes",
    category: "DevOps",
    description: "An open-source container orchestration system for automating application deployment, scaling, and management.",
    hint: "It manages and coordinates clusters of software containers automatically in production."
  },
  {
    word: "Encryption",
    category: "Security",
    description: "The process of encoding information or data into a secret format so that only authorized parties can read it.",
    hint: "It converts readable sensitive text into scrambled secret code to protect privacy."
  },
  {
    word: "Queue",
    category: "Backend Architecture",
    description: "A message broker or data structure where tasks are processed in a first-in, first-out (FIFO) sequence.",
    hint: "It holds background jobs or tasks in order so systems can process them one by one."
  },
  {
    word: "Microservices",
    category: "Architecture",
    description: "An architectural style that structures an application as a collection of small, independently deployable services.",
    hint: "It breaks a huge monolith app into small, independent specialized backend services."
  },
  {
    word: "CI/CD",
    category: "DevOps Pipeline",
    description: "Continuous Integration and Continuous Deployment. Automated pipelines that test, build, and deploy software changes to production.",
    hint: "It automates building, testing, and shipping code to production servers automatically."
  },
  {
    word: "Deployment",
    category: "Release Management",
    description: "The process of releasing a new version of a software application to a live server environment for users.",
    hint: "It is the event of pushing updated application code live to users."
  },
  {
    word: "Server",
    category: "Hardware & Backend",
    description: "A computer hardware or software system that provides data, resources, or services to other client devices over a network.",
    hint: "It listens for client network requests and responds with websites, APIs, or database results."
  },
  {
    word: "Refactoring",
    category: "Code Quality",
    description: "The process of restructuring existing computer code without changing its external behavior to improve readability and maintainability.",
    hint: "It means rewriting and cleaning up code behind the scenes without changing how it works for users."
  },
  {
    word: "Cookies",
    category: "Web & Security",
    description: "Small blocks of data created by a web server while a user is browsing a website and placed on the user's computer or device.",
    hint: "Small text files saved in web browsers to remember user logins, preferences, and sessions."
  },
  {
    word: "DNS",
    category: "Networking",
    description: "Domain Name System. The phonebook of the internet that translates human-readable domain names (like Google.com) into numerical IP addresses.",
    hint: "It translates human domain names into computer IP addresses behind the scenes."
  },
  {
    word: "Load Balancer",
    category: "Infrastructure",
    description: "A device or software that distributes network traffic efficiently across multiple servers to prevent overload.",
    hint: "It spreads incoming website traffic evenly across multiple backend servers so none crash."
  },
  {
    word: "Log File",
    category: "Observability",
    description: "A record of events, errors, or activities kept by an operating system or software application for debugging and audit.",
    hint: "It keeps a chronological history of system events, user actions, and error traces."
  },
  {
    word: "Authentication",
    category: "Security",
    description: "The process or mechanism of verifying the identity of a user, device, or system before granting access.",
    hint: "It verifies whether a user is who they claim to be using passwords, tokens, or biometrics."
  },
  {
    word: "Websocket",
    category: "Real-time Network",
    description: "A computer communications protocol providing full-duplex, real-time communication channels over a single TCP connection.",
    hint: "It opens an instant two-way live communication channel between server and client without refreshing."
  },
  {
    word: "Middleware",
    category: "Backend Architecture",
    description: "Software code that acts as a bridge between an operating system or database and applications, or sits between request and response.",
    hint: "It sits between incoming HTTP requests and final route handlers to check auth, logs, or formatting."
  }
];

export function getRandomWord(usedWords = []) {
  const available = TECH_WORDS.filter(w => !usedWords.includes(w.word));
  const pool = available.length > 0 ? available : TECH_WORDS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
