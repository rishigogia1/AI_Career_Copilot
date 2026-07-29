/**
 * Curated progressive 7-day study templates for 12 major skill domains.
 * Each template builds step-by-step with zero duplicate content.
 */

export const getSkillCategory = (skill) => {
  const s = String(skill).toLowerCase();
  if (s.includes("html") || s.includes("css") || s.includes("js") || s.includes("javascript") || s.includes("react") || s.includes("vue") || s.includes("angular") || s.includes("svelte") || s.includes("nextjs") || s.includes("next.js") || s.includes("typescript") || s.includes("frontend") || s.includes("ui") || s.includes("ux") || s.includes("tailwind") || s.includes("sass") || s.includes("web dev")) {
    return "Frontend";
  }
  if (s.includes("node") || s.includes("express") || s.includes("python") || s.includes("django") || s.includes("flask") || s.includes("java") || s.includes("spring") || s.includes("golang") || s.includes("ruby") || s.includes("rails") || s.includes("backend") || s.includes("api") || s.includes("graphql") || s.includes("rest") || s.includes("microservices")) {
    return "Backend";
  }
  if (s.includes("artificial") || s.includes("neural") || s.includes("nlp") || s.includes("computer vision") || s.includes("openai") || s.includes("llm") || s.includes("prompt") || s.includes("genai") || s.includes("generative ai") || s.includes("transformer") || s.includes("tensor") || s.includes("pytorch") || s.includes("ai")) {
    return "AI";
  }
  if (s.includes("machine learning") || s.includes("pandas") || s.includes("numpy") || s.includes("scikit") || s.includes("sklearn") || s.includes("regression") || s.includes("classification") || s.includes("clustering") || s.includes("data science") || s.includes("ml")) {
    return "ML";
  }
  if (s.includes("aws") || s.includes("azure") || s.includes("gcp") || s.includes("cloud") || s.includes("serverless") || s.includes("lambda") || s.includes("s3") || s.includes("ec2") || s.includes("iam")) {
    return "Cloud";
  }
  if (s.includes("docker") || s.includes("kubernetes") || s.includes("ci/cd") || s.includes("cicd") || s.includes("jenkins") || s.includes("gitlab") || s.includes("actions") || s.includes("devops") || s.includes("terraform") || s.includes("ansible") || s.includes("linux") || s.includes("bash")) {
    return "DevOps";
  }
  if (s.includes("communication") || s.includes("presentation") || s.includes("speaking") || s.includes("writing") || s.includes("listening") || s.includes("negotiation") || s.includes("persuasion") || s.includes("soft skills") || s.includes("interpersonal")) {
    return "Communication";
  }
  if (s.includes("leadership") || s.includes("management") || s.includes("team") || s.includes("scrum") || s.includes("agile") || s.includes("product") || s.includes("mentoring") || s.includes("delegation")) {
    return "Leadership";
  }
  if (s.includes("aptitude") || s.includes("logic") || s.includes("math") || s.includes("reasoning") || s.includes("quantitative") || s.includes("verbal") || s.includes("problem solving")) {
    return "Aptitude";
  }
  if (s.includes("sql") || s.includes("mysql") || s.includes("postgres") || s.includes("mongodb") || s.includes("redis") || s.includes("dynamo") || s.includes("database") || s.includes("schema") || s.includes("nosql")) {
    return "Database";
  }
  if (s.includes("security") || s.includes("cyber") || s.includes("penetration") || s.includes("hacking") || s.includes("cryptography") || s.includes("firewall") || s.includes("vuln")) {
    return "Cybersecurity";
  }
  if (s.includes("dsa") || s.includes("structure") || s.includes("algorithm") || s.includes("leetcode") || s.includes("array") || s.includes("list") || s.includes("tree") || s.includes("graph") || s.includes("sort") || s.includes("search") || s.includes("recursion") || s.includes("dynamic programming")) {
    return "DSA";
  }
  return "General";
};

export const getFallbackRoadmap = (skill, category, role) => {
  switch (category) {
    case "Frontend":
      return {
        skill,
        overview: `A progressive 7-day frontend syllabus to master ${skill} for ${role}.`,
        domain: "Frontend Engineering",
        learningOutcomes: [
          `Implement semantic interfaces with ${skill}`,
          `Manage complex component states and side-effects`,
          `Deploy an optimized, responsive client-side interface`
        ],
        days: [
          {
            day: 1,
            title: `Day 1: ${skill} Fundamentals & Rendering`,
            contentType: "Theory",
            estimatedTime: "2 hours",
            difficulty: "Beginner",
            learningObjectives: ["Explain virtual DOM/rendering cycles", "Structure modular UI code"],
            theory: `Focuses on rendering execution and basic layout. The core theory covers how ${skill} handles declarative updates and updates the screen interface efficiently.`,
            details: `Study core syntax, folder structures, and basic setup guidelines for ${skill}.`,
            practice: `Implement a static component library with basic routing or styling modules.`,
            resource: { title: "Frontend Masters Guide", link: "https://frontendmasters.com" },
            interviewQuestion: {
              question: `What is the difference between a declarative UI and imperative UI in ${skill}?`,
              answer: "Declarative UI focuses on 'what' the interface should look like for a given state, letting the framework manage DOM updates. Imperative UI manually targets elements step-by-step."
            },
            resumeTip: "Architected declarative client components to ensure modular reuse."
          },
          {
            day: 2,
            title: "Day 2: State Management & Event Handling",
            contentType: "Hands-on Lab",
            estimatedTime: "2.5 hours",
            difficulty: "Beginner",
            learningObjectives: ["Manage local state variables", "Capture interactive user clicks"],
            theory: "Explores unidirectional data flow and interactive states. Learn how UI mutations trigger rerenders.",
            details: "Read on state encapsulation, passing parameters through props/attributes, and state propagation.",
            practice: "Build a functioning form validator that captures text input and handles dynamic validation warnings.",
            resource: { title: "MDN Web Docs", link: "https://developer.mozilla.org" },
            interviewQuestion: {
              question: "How does state differ from props in component architectures?",
              answer: "State is local, mutable data managed internally by the component itself. Props are immutable parameters passed down from a parent container."
            },
            resumeTip: "Implemented robust validation event-handlers decreasing user input errors."
          },
          {
            day: 3,
            title: "Day 3: Side Effects & Async Fetching",
            contentType: "Industry Use Cases",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Integrate external REST APIs", "Handle lifecycle events cleanly"],
            theory: "Covers how to safely synchronize components with external servers without introducing infinite render loops.",
            details: "Deep dive into lifecycle hooks, subscription cleanups, and loading states.",
            practice: "Create a search dashboard fetching items from a mock public endpoint with search debouncing.",
            resource: { title: "API Fetching Patterns", link: "https://javascript.info" },
            interviewQuestion: {
              question: "Why must you clean up subscriptions or timers in lifecycle hooks?",
              answer: "Failing to clean up subscriptions or listeners triggers memory leaks, as these bindings persist even after the component is unmounted."
            },
            resumeTip: "Integrated debounce search algorithms that reduced API overhead."
          },
          {
            day: 4,
            title: "Day 4: Routing & Shared Application Context",
            contentType: "Mini Project",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Set up multi-page navigation", "Avoid prop-drilling with global context"],
            theory: "Focuses on global state stores and routing engines to manage complex multi-view applications.",
            details: "Study single-page routing structures, URL parameters, and context providers.",
            practice: "Refactor your search dashboard to support detail-view pages and store theme preferences globally.",
            resource: { title: "Single Page App Patterns", link: "https://web.dev" },
            interviewQuestion: {
              question: "What is prop-drilling and how do you resolve it?",
              answer: "Prop-drilling occurs when data is passed down through multiple layers of nested components that don't need it. Resolved using Context APIs or state libraries."
            },
            resumeTip: "Optimized app state using global context, eliminating complex prop-drilling."
          },
          {
            day: 5,
            title: "Day 5: Performance Tuning & Optimization",
            contentType: "Quiz & Tuning",
            estimatedTime: "3.5 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Identify heavy renders", "Memoize computationally expensive outputs"],
            theory: "Deals with performance profiles, rendering optimizations, lazy loading, and bundle split techniques.",
            details: "Analyze flame graphs, code splitting syntax, and component memoization.",
            practice: "Audit a heavy list component, implement virtualized listing, and lazy-load secondary pages.",
            quiz: [
              {
                question: "Which technique prevents component rerendering when props haven't changed?",
                options: ["Code splitting", "Memoization / React.memo", "State promotion", "Callback injection"],
                correctOption: "Memoization / React.memo"
              }
            ],
            interviewQuestion: {
              question: "Explain code-splitting and why it is crucial for web applications.",
              answer: "Code-splitting breaks the application bundle into smaller chunks loaded on-demand, accelerating initial page load speed."
            },
            resumeTip: "Boosted initial page load speed by 35% using code-splitting and lazy loading."
          },
          {
            day: 6,
            title: "Day 6: Automated Testing & Access Guards",
            contentType: "Portfolio Task",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Write element unit tests", "Restrict pages based on authentication status"],
            theory: "Covers unit testing component hierarchies and building route middleware to protect private pages.",
            details: "Study mocking frameworks, DOM assertion tests, and auth validation guards.",
            practice: "Write Jest/Testing Library tests for a login view and implement a private route guard wrapper.",
            resource: { title: "Testing Library Docs", link: "https://testing-library.com" },
            interviewQuestion: {
              question: "How do you test user click events in a UI unit test?",
              answer: "By rendering the component in a virtual DOM, locating the target node, and simulating user interactions using testing utilities."
            },
            resumeTip: "Achieved 90% unit testing coverage on core client-side router configurations."
          },
          {
            day: 7,
            title: "Day 7: Production Compilation & Capstone Deploy",
            contentType: "Final Capstone",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Bundle assets for production", "Configure staging CD environments"],
            theory: "Explores compilation pipelines, caching strategies, header configs, and continuous deployment workflows.",
            details: "Examine environment variables, asset minification, and hosting targets.",
            practice: "Build and publish a progressive dashboard to Vercel/Netlify with fully verified routes.",
            portfolioTask: "Deploy a production-ready Web App, link GitHub, and document setup in the README.",
            interviewQuestion: {
              question: "What optimizations occur during a production build step?",
              answer: "Asset minification, tree-shaking (removing unused code), CSS purging, and cache-busting hashing of filenames."
            },
            resumeTip: "Deployed automated CD pipelines for frontend assets, reducing build times."
          }
        ],
        project: {
          title: "Enterprise Dashboard Web Portal",
          description: "Build a multi-page dashboard featuring search, global configurations, auth redirection, and tested widgets.",
          features: [
            "Responsive dashboard interface with dark-mode toggle",
            "Lazy-loaded dynamic pages with route authorization guards",
            "Full unit testing suite targeting interactive elements"
          ]
        }
      };

    case "Backend":
      return {
        skill,
        overview: `A comprehensive 7-day backend syllabus to master ${skill} for ${role}.`,
        domain: "Backend Engineering",
        learningOutcomes: [
          `Build structured, secure RESTful APIs with ${skill}`,
          `Implement persistent data schemas and relational queries`,
          `Configure secure token authorization protocols`
        ],
        days: [
          {
            day: 1,
            title: `Day 1: ${skill} Architecture & HTTP Basics`,
            contentType: "Theory",
            estimatedTime: "2 hours",
            difficulty: "Beginner",
            learningObjectives: ["Explain non-blocking IO vs blocking IO", "Handle simple HTTP requests"],
            theory: "Discusses backend thread scheduling, event handling, and HTTP request-response structures.",
            details: "Review runtime environments, request/response objects, and routing foundations.",
            practice: "Launch a basic API server listening on localhost that returns static JSON diagnostics.",
            resource: { title: "Backend Architectural Patterns", link: "https://roadmap.sh/backend" },
            interviewQuestion: {
              question: "Explain the difference between GET and POST request methods.",
              answer: "GET requests retrieve data and encode variables in the URL. POST requests submit data payloads inside the request body."
            },
            resumeTip: "Engineered scalable web servers handling standard RESTful requests."
          },
          {
            day: 2,
            title: "Day 2: Middleware & Routing Engines",
            contentType: "Hands-on Lab",
            estimatedTime: "2.5 hours",
            difficulty: "Beginner",
            learningObjectives: ["Write request pre-processing middleware", "Handle server parameter routes"],
            theory: "Covers request pipe processing. Learn how interceptors handle loggers, CORS, and parsers before routes trigger.",
            details: "Read on express middleware design, request mutation, and custom error boundaries.",
            practice: "Write a logging middleware that records incoming request IP addresses and timestamps.",
            resource: { title: "API Middleware Patterns", link: "https://expressjs.com" },
            interviewQuestion: {
              question: "What is middleware in web framework contexts?",
              answer: "Middleware is functions that execute sequentially in the request-response cycle, allowing validation, logging, or payload modifications."
            },
            resumeTip: "Designed request-interception middleware to enforce validation rules."
          },
          {
            day: 3,
            title: "Day 3: Database Integration & Object-Document Mapping",
            contentType: "Industry Use Cases",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Connect database clients safely", "Structure data schemas with integrity constraints"],
            theory: "Examines database connection pooling, schema validations, and standard CRUD query patterns.",
            details: "Understand database drivers, indexing basics, and query projection concepts.",
            practice: "Connect your backend server to a local database and perform structured user creation operations.",
            resource: { title: "Database Schema Best Practices", link: "https://mongoosejs.com" },
            interviewQuestion: {
              question: "Why should you use parameterized database queries?",
              answer: "Parameterized queries separate the SQL code from user inputs, completely neutralizing SQL Injection security vulnerabilities."
            },
            resumeTip: "Integrated database layers with schema validation, improving data cleanliness."
          },
          {
            day: 4,
            title: "Day 4: JWT Authentication & User Authorization",
            contentType: "Mini Project",
            estimatedTime: "3.5 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Issue encrypted authentication tokens", "Restrict routes to authenticated sessions"],
            theory: "Deals with stateless auth, signing tokens with secret keys, and checking token signatures via headers.",
            details: "Study JWT structure, bcrypt passwords hashing, and token expiration strategies.",
            practice: "Create login and signup endpoints that return JWT tokens and verify access on a private dashboard endpoint.",
            resource: { title: "OWASP Auth Guidelines", link: "https://owasp.org" },
            interviewQuestion: {
              question: "How does stateless JWT authentication differ from session-based authentication?",
              answer: "Session auth stores user status on the server and checks it via session IDs. JWT stores claims on the client, signed cryptographically by the server."
            },
            resumeTip: "Implemented secure bcrypt password hashing and token-based API authentication."
          },
          {
            day: 5,
            title: "Day 5: Error Isolation & Logging Strategies",
            contentType: "Quiz & Tuning",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Implement global catch blocks", "Integrate file loggers"],
            theory: "Focuses on preventing backend crashes through global error handling and setting up structured Winston log files.",
            details: "Read on try-catch scopes, exception bubbling, and production error level tracking.",
            practice: "Create an error-handling wrapper middleware that prevents route stack exposure on errors.",
            quiz: [
              {
                question: "Which HTTP status code represents an Internal Server Error?",
                options: ["400 Bad Request", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
                correctOption: "500 Internal Server Error"
              }
            ],
            interviewQuestion: {
              question: "Why should you avoid exposing raw error details in production API responses?",
              answer: "Raw stack traces expose database structures, paths, and dependencies, giving malicious users blueprint maps of vulnerability vectors."
            },
            resumeTip: "Formulated global exception interceptors, achieving 100% server uptime during errors."
          },
          {
            day: 6,
            title: "Day 6: Automated Integration Testing",
            contentType: "Portfolio Task",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Write request tests using Supertest", "Mock database client models"],
            theory: "Discusses integration tests, testing servers, database assertions, and mocking remote connections.",
            details: "Read on test environment configuration, database cleanses, and endpoint expectations.",
            practice: "Write integration tests verifying signup validation errors and correct JWT delivery.",
            resource: { title: "API Integration Testing", link: "https://jestjs.io" },
            interviewQuestion: {
              question: "What is the difference between unit testing and integration testing in backend development?",
              answer: "Unit testing tests individual functions in isolation. Integration testing verifies multiple modules working together, such as routing, auth, and database writes."
            },
            resumeTip: "Implemented integration test pipelines, raising API validation confidence."
          },
          {
            day: 7,
            title: "Day 7: Deployment, Cors & Security Headers",
            contentType: "Final Capstone",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Configure CORS lists", "Deploy to cloud compute runtimes"],
            theory: "Covers cross-origin resource sharing, Helmet security headers, port assignment, and cloud setup.",
            details: "Understand CORS preflight options, environment mappings, and process managers.",
            practice: "Deploy the authentication backend to a cloud host (Render, Heroku, AWS EC2) and connect the client.",
            portfolioTask: "Publish the tested backend code repository with automated configuration and database setup scripts.",
            interviewQuestion: {
              question: "What is CORS and why does the browser enforce it?",
              answer: "CORS (Cross-Origin Resource Sharing) is a security standard restricting client scripts from requesting APIs hosted on different domains unless approved by headers."
            },
            resumeTip: "Deployed backend microservices with secure CORS and Helmet configurations."
          }
        ],
        project: {
          title: "Secure Enterprise CRUD API Engine",
          description: "Build an API engine featuring JWT authentication, route validation middleware, logging, and automated testing.",
          features: [
            "JWT token login and password cryptography pipelines",
            "Relational database interactions with schema integrity validation",
            "Supertest integration suites verifying route status codes"
          ]
        }
      };

    case "DevOps":
      return {
        skill,
        overview: `A curated 7-day curriculum to master DevOps processes using ${skill}.`,
        domain: "DevOps & Infrastructure",
        learningOutcomes: [
          `Configure automated build environments using ${skill}`,
          `Manage infrastructure virtualization assets safely`,
          `Deploy structured pipelines integrating linting and testing`
        ],
        days: [
          {
            day: 1,
            title: `Day 1: ${skill} virtualization & Core Architecture`,
            contentType: "Theory",
            estimatedTime: "2 hours",
            difficulty: "Beginner",
            learningObjectives: ["Contrast VM hypervisors with OS level virtualization", "Install runtime binaries"],
            theory: "Deals with containerization vs hardware virtualization, resource isolation, namespaces, and kernel control groups.",
            details: "Read the architectural blueprints, file engines, and CLI fundamentals.",
            practice: "Set up the local environment and launch your first isolated diagnostic utility.",
            resource: { title: "DevOps Roadmap Guide", link: "https://roadmap.sh/devops" },
            interviewQuestion: {
              question: "How do container systems differ from virtual machines?",
              answer: "VMs run full guest operating systems on hypervisors. Containers share the host OS kernel and isolate processes using namespaces."
            },
            resumeTip: "Introduced container isolation technologies, minimizing development differences."
          },
          {
            day: 2,
            title: "Day 2: Custom Declarative Build Configurations",
            contentType: "Hands-on Lab",
            estimatedTime: "3 hours",
            difficulty: "Beginner",
            learningObjectives: ["Write build configuration scripts", "Optimize configuration layers"],
            theory: "Examines configuration step caching, layer accumulation, and utilizing multi-stage build systems to compress final runtimes.",
            details: "Study file transfer instructions, system packages dependencies, and base image specifications.",
            practice: "Compile a custom build file that builds a lightweight Node.js/Python microservice environment.",
            resource: { title: "Config file Best Practices", link: "https://docs.docker.com" },
            interviewQuestion: {
              question: "Why should you use multi-stage builds?",
              answer: "Multi-stage builds allow separating build-time tools from the final runtime, resulting in smaller, more secure deployment artifacts."
            },
            resumeTip: "Optimized configuration scripts, reducing artifact volumes by 45%."
          },
          {
            day: 3,
            title: "Day 3: Persistent Storage & Isolated Network Routing",
            contentType: "Industry Use Cases",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Mount persistent folders to host paths", "Link containers inside internal bridges"],
            theory: "Covers stateless process designs. Learn to attach storage networks and route ports to make containers accessible.",
            details: "Read on volumes, bind mounts, network drivers, and port mappings.",
            practice: "Launch a database container mounted to local storage, and connect it to your application runtime.",
            resource: { title: "Container Networking Basics", link: "https://kubernetes.io/docs" },
            interviewQuestion: {
              question: "What happens to data inside a container when it is deleted without a volume?",
              answer: "The data is lost permanently, as the container writable layer is ephemeral and bound strictly to the container lifecycle."
            },
            resumeTip: "Configured persistent network bridges, ensuring application failover safety."
          },
          {
            day: 4,
            title: "Day 4: Multi-Container Orchestration & Composition",
            contentType: "Mini Project",
            estimatedTime: "3.5 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Write multi-service startup descriptors", "Coordinate boot sequences"],
            theory: "Deals with defining complete system topologies in YAML, managing service environment injections, and setting startup orders.",
            details: "Study orchestration files, environment overrides, dependency lists, and shared volumes.",
            practice: "Draft a compose script launching a frontend server, backend API, and relational database with one command.",
            resource: { title: "Orchestration Configurations", link: "https://docs.docker.com/compose" },
            interviewQuestion: {
              question: "What is the purpose of orchestration YAML configs in DevOps workflow?",
              answer: "They document and automate the deployment of multi-service applications, configuring networks, volumes, and startup parameters."
            },
            resumeTip: "Authored infrastructure composition models, decreasing local onboarding setup to minutes."
          },
          {
            day: 5,
            title: "Day 5: Infrastructure Health Checks & Logging",
            contentType: "Quiz & Tuning",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Write custom health queries", "Collect stdout/stderr streams"],
            theory: "Focuses on automatic state monitoring. Learn how orchestrators detect crashes and automatically restart failing services.",
            details: "Study status metrics, health exit codes, and logging drivers.",
            practice: "Configure an automated health check script that queries an endpoint and restarts on failures.",
            quiz: [
              {
                question: "Which instruction monitors container vitality periodically?",
                options: ["EXPOSE", "HEALTHCHECK", "RUN", "CMD"],
                correctOption: "HEALTHCHECK"
              }
            ],
            interviewQuestion: {
              question: "How do orchestrators use health check parameters?",
              answer: "They periodically probe endpoints. If a threshold of failures is reached, they mark the container unhealthy and provision a new instance."
            },
            resumeTip: "Introduced periodic health metrics, achieving self-healing status for API runtimes."
          },
          {
            day: 6,
            title: "Day 6: Automated CI Pipeline Integration",
            contentType: "Portfolio Task",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Build runner tasks in GitHub Actions/GitLab", "Automate linting checks"],
            theory: "Covers continuous integration pipelines, triggers, virtual runners, build contexts, and caching layers.",
            details: "Study pipeline triggers, step sequences, environment variables, and artifact publishing.",
            practice: "Create a YAML pipeline configuration that builds and tests your containers on every GitHub commit.",
            resource: { title: "GitHub Actions Tutorials", link: "https://github.com/features/actions" },
            interviewQuestion: {
              question: "What is the primary benefit of continuous integration (CI)?",
              answer: "CI automates testing and building code changes, detecting integration errors early in development."
            },
            resumeTip: "Implemented automated CI pipelines, slashing code merge issues."
          },
          {
            day: 7,
            title: "Day 7: Registry Publishing & Production CD",
            contentType: "Final Capstone",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Push images to secure registries", "Deploy configurations to live staging VMs"],
            theory: "Explores access controls, deployment scripts, webhook configurations, and target virtual host routing.",
            details: "Examine security tag standards, registry auth, SSH credentials deployment, and staging verification.",
            practice: "Push build configurations to a container registry and orchestrate deployment to a cloud server.",
            portfolioTask: "Deploy a multi-service web project to AWS/DigitalOcean with fully configured CI/CD and secure environments.",
            interviewQuestion: {
              question: "How do you secure container registry images in production environments?",
              answer: "By executing vulnerability scans on build, using signed images, and restricting registry pull permissions using IAM roles."
            },
            resumeTip: "Managed live cloud deployments with continuous delivery, cutting release times."
          }
        ],
        project: {
          title: "Automated Multi-Service Deployment Engine",
          description: "Develop a multi-service deployment orchestrating Frontend, Backend, and Database with automated GitHub CI pipelines.",
          features: [
            "Orchestrated multi-service local configurations with persistent storage mounts",
            "Lightweight multi-stage configuration optimization layers",
            "Continuous Integration pipeline validating commits with automated testing suites"
          ]
        }
      };

    case "AI":
      return {
        skill,
        overview: `An advanced 7-day curriculum to master AI structures and integrations for ${skill} as a ${role}.`,
        domain: "Artificial Intelligence",
        learningOutcomes: [
          `Understand deep neural architectures and transformers`,
          `Integrate large language models (LLM) APIs with validation guards`,
          `Build agentic retrieval systems (RAG)`
        ],
        days: [
          {
            day: 1,
            title: `Day 1: ${skill} AI Core Neural Networks`,
            contentType: "Theory",
            estimatedTime: "2 hours",
            difficulty: "Beginner",
            learningObjectives: ["Explain feedforward neural propagation", "Calculate loss gradients"],
            theory: "Deals with layers, activation functions, backpropagation algorithms, and optimizer dynamics.",
            details: "Read the mathematical definitions of layers, vectors, and weights.",
            practice: "Map a simple single-neuron network backpropagation routine on paper or array scripts.",
            resource: { title: "Deep Learning Foundations", link: "https://www.deeplearning.ai" },
            interviewQuestion: {
              question: "Explain the role of activation functions in neural networks.",
              answer: "Activation functions introduce non-linearity, allowing the model to learn complex relationships in data."
            },
            resumeTip: "Constructed custom neural architectures to handle multidimensional data feeds."
          },
          {
            day: 2,
            title: "Day 2: Transformers & Language Model Architectures",
            contentType: "Hands-on Lab",
            estimatedTime: "3 hours",
            difficulty: "Beginner",
            learningObjectives: ["Define self-attention calculations", "Trace token embedding pipelines"],
            theory: "Covers encoder-decoder sequences, attention vectors, tokenization pipelines, and temperature configurations.",
            details: "Study semantic token layouts, self-attention mathematical blocks, and context windows.",
            practice: "Write a token tracking utility that calculates payload overhead for language API targets.",
            resource: { title: "HuggingFace Transformers Tutorials", link: "https://huggingface.co/learn" },
            interviewQuestion: {
              question: "What is the self-attention mechanism in transformer architectures?",
              answer: "Self-attention calculates weighted importances for words in a sequence, allowing the model to contextually link distant tokens."
            },
            resumeTip: "Optimized model contexts, mitigating token processing costs."
          },
          {
            day: 3,
            title: "Day 3: LLM APIs & Prompt Parameter Engineering",
            contentType: "Industry Use Cases",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Connect language model interfaces", "Apply JSON schema response validation"],
            theory: "Explores prompt construction principles, zero-shot and few-shot classifications, and structured response constraints.",
            details: "Read guidelines on formatting instruction blocks, parsing JSON outputs, and handling API exceptions.",
            practice: "Write an API client that queries an LLM and parses the response into verified system records.",
            resource: { title: "Prompt Engineering Guide", link: "https://www.promptingguide.ai" },
            interviewQuestion: {
              question: "What is the difference between Zero-Shot and Few-Shot prompting?",
              answer: "Zero-Shot asks a model to execute a task without examples. Few-Shot includes a few input-output examples in the context to guide response structures."
            },
            resumeTip: "Integrated structured JSON output validations with external LLM APIs."
          },
          {
            day: 4,
            title: "Day 4: Vector Databases & Embeddings",
            contentType: "Mini Project",
            estimatedTime: "3.5 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Generate vector representations of text", "Perform cosine similarity index queries"],
            theory: "Focuses on vector spaces, dimensional reductions, semantic similarities, and index performance (HNSW).",
            details: "Study embedding models, document chunking rules, and database schema setups.",
            practice: "Chunk a collection of documents, index them to a vector database, and perform semantic lookups.",
            resource: { title: "Vector DB Foundations", link: "https://www.pinecone.io/learn" },
            interviewQuestion: {
              question: "How does vector search differ from keyword database search?",
              answer: "Keyword search matches exact characters. Vector search compares coordinate similarities in high-dimensional spaces, retrieving semantic meanings."
            },
            resumeTip: "Deployed vector index databases, accelerating semantic query speeds."
          },
          {
            day: 5,
            title: "Day 5: Retrieval-Augmented Generation (RAG) Architecture",
            contentType: "Quiz & Tuning",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Combine vector indices with generation prompts", "Assess response hallucinations"],
            theory: "Covers RAG structures. Learn to feed relevant contexts to LLMs to answer domains-specific queries safely.",
            details: "Study prompt injection methods, reranking tools, and ground-truth validation rules.",
            practice: "Create a question-answering CLI utility using documents retrieved from your Day 4 index.",
            quiz: [
              {
                question: "Which component retrieves external context in a RAG architecture?",
                options: ["The LLM generator", "The Vector Search Index", "The Parser", "The Tokenizer"],
                correctOption: "The Vector Search Index"
              }
            ],
            interviewQuestion: {
              question: "What is RAG and why is it used?",
              answer: "RAG retrieves relevant domain documents from an index and passes them to an LLM context, reducing hallucination without expensive retraining."
            },
            resumeTip: "Engineered RAG information pipelines, reducing model halluncinations."
          },
          {
            day: 6,
            title: "Day 6: Agentic Workflows & Tool Calling",
            contentType: "Portfolio Task",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Expose system APIs to model executor loops", "Handle validation feedback cycles"],
            theory: "Deals with autonomous loops, function definitions, tool mappings, parser routing, and step limits.",
            details: "Read on ReAct framework designs, tool schemas, and step execution controls.",
            practice: "Write an agent that calls a local system calculator tool to solve mathematical prompts.",
            resource: { title: "LangChain Agentic Design", link: "https://python.langchain.com" },
            interviewQuestion: {
              question: "How does function calling work in modern LLM architectures?",
              answer: "The model analyzes user input and outputs a structured tool name and arguments. The backend executes the tool and passes results back to the model."
            },
            resumeTip: "Integrated agentic task-planners using function calling capabilities."
          },
          {
            day: 7,
            title: "Day 7: Evaluation Frameworks & Staging Deploy",
            contentType: "Final Capstone",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Define RAGAS eval metrics", "Deploy agent endpoints to staging VM"],
            theory: "Explores system evaluations, semantic correctness, latency tracking, and hosting secure API proxies.",
            details: "Examine evaluation sets, prompt caching, host servers, and security proxies.",
            practice: "Publish your AI agent to an API endpoint with input token sanitization and rate limits.",
            portfolioTask: "Release an enterprise RAG agent repo with automated vector indexing and evaluation suite tests.",
            interviewQuestion: {
              question: "How do you mitigate prompt injection security risks in AI portals?",
              answer: "By utilizing strict input validators, isolating system instructions from user inputs, and deploying system gateway scanners."
            },
            resumeTip: "Designed and evaluated production agent pipelines, maintaining fast query speeds."
          }
        ],
        project: {
          title: "Enterprise Semantic Knowledge Base Agent",
          description: "Build an autonomous AI agent utilizing vector indexing, tool calling APIs, validation monitors, and evaluation tests.",
          features: [
            "Document parser pipelines generating and updating vector index models",
            "Interactive tool execution engines with function schemas",
            "Evaluation suites assessing response context faithfulness metrics"
          ]
        }
      };

    case "ML":
      return {
        skill,
        overview: `A structured 7-day machine learning track to master ${skill} for ${role}.`,
        domain: "Machine Learning",
        learningOutcomes: [
          `Clean and preprocess structured datasets`,
          `Train and optimize classification and regression models`,
          `Deploy machine learning models to production endpoints`
        ],
        days: [
          {
            day: 1,
            title: `Day 1: ${skill} Mathematical Foundations & Data Loading`,
            contentType: "Theory",
            estimatedTime: "2 hours",
            difficulty: "Beginner",
            learningObjectives: ["Perform linear algebra matrix transforms", "Load datasets using pandas"],
            theory: "Covers linear algebra, calculus gradients, statistics, and importing raw CSV/Parquet files.",
            details: "Understand vector operations, dataframe features, and basic data distributions.",
            practice: "Load a housing database, profile distributions, and calculate feature statistics.",
            resource: { title: "Scikit-Learn Getting Started", link: "https://scikit-learn.org/stable" },
            interviewQuestion: {
              question: "Explain the difference between supervised and unsupervised learning.",
              answer: "Supervised learning uses labeled training data to predict outcomes. Unsupervised learning analyzes unlabeled datasets to identify hidden structures."
            },
            resumeTip: "Engineered high-performance data ingestion processes for large datasets."
          },
          {
            day: 2,
            title: "Day 2: Exploratory Data Analysis & Feature Engineering",
            contentType: "Hands-on Lab",
            estimatedTime: "3 hours",
            difficulty: "Beginner",
            learningObjectives: ["Handle missing data entries", "Convert categorical data using encoding"],
            theory: "Deals with data imputation, one-hot encoding, feature normalization (scaling), and correlation matrix calculations.",
            details: "Study outlier treatments, skewness adjustments, and standard scaler definitions.",
            practice: "Prepare a clinical dataset by mapping encodings, handling null values, and scaling features.",
            resource: { title: "Kaggle Feature Engineering Courses", link: "https://www.kaggle.com/learn" },
            interviewQuestion: {
              question: "Why should we normalize features before training models?",
              answer: "Features with vastly different scales can bias optimizers, making gradient descent converge slowly or unevenly."
            },
            resumeTip: "Engineered robust preprocessing pipelines, improving downstream model efficiency."
          },
          {
            day: 3,
            title: "Day 3: Supervised Regression Architectures",
            contentType: "Industry Use Cases",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Train linear regression models", "Evaluate models using Mean Squared Error (MSE)"],
            theory: "Examines optimization costs, gradient descent updates, regularization (L1 Lasso / L2 Ridge), and underfitting vs overfitting.",
            details: "Learn model training syntax, cost functions, and validation boundaries.",
            practice: "Train a regularization model predicting real estate rates and evaluate R-squared values.",
            resource: { title: "Regression Fundamentals", link: "https://towardsdatascience.com" },
            interviewQuestion: {
              question: "How does L1 regularization differ from L2 regularization?",
              answer: "L1 Lasso penalizes absolute values of coefficients, pushing irrelevant weights to absolute zero. L2 Ridge penalizes squared values, shrinking weights toward zero."
            },
            resumeTip: "Implemented regularized regression frameworks, lowering predictions error variances."
          },
          {
            day: 4,
            title: "Day 4: Classification Algorithms",
            contentType: "Mini Project",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Train logistic models", "Implement Random Forest classifiers"],
            theory: "Covers sigmoid logic, tree decision flows, ensemble voting, bagging, and classification boundaries.",
            details: "Analyze tree depths, hyperparameters, decision nodes, and ensemble algorithms.",
            practice: "Construct a customer churn classifier using ensemble tree methods.",
            resource: { title: "Ensemble Methods Guide", link: "https://machinelearningmastery.com" },
            interviewQuestion: {
              question: "What is entropy in decision tree classifiers?",
              answer: "Entropy is a measure of impurity or randomness in a group of values. Trees select splits that minimize entropy (maximizing information gain)."
            },
            resumeTip: "Architected ensemble random forest models, maximizing prediction accuracies."
          },
          {
            day: 5,
            title: "Day 5: Evaluation Protocols & Hyperparameter Tuning",
            contentType: "Quiz & Tuning",
            estimatedTime: "3.5 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Calculate confusion matrices", "Optimize models using Grid Search"],
            theory: "Explores precision, recall, F1 scores, ROC-AUC, cross-validation, and tuning parameters.",
            details: "Analyze score trade-offs, validation folds, and search space optimizations.",
            practice: "Execute k-fold validation searches on your classifier to optimize hyperparameters.",
            quiz: [
              {
                question: "Which metric is best when cost of false negatives is high (e.g. medical diagnosis)?",
                options: ["Accuracy", "Precision", "Recall", "R-squared"],
                correctOption: "Recall"
              }
            ],
            interviewQuestion: {
              question: "What is cross-validation and why do we use it?",
              answer: "Cross-validation splits datasets into multiple validation folds. It ensures model generalization, avoiding overfitting on a single split."
            },
            resumeTip: "Configured hyperparameter tuning grids, elevating classification F1 scores."
          },
          {
            day: 6,
            title: "Day 6: Model Serialization & Pipeline Packaging",
            contentType: "Portfolio Task",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Serialize models to disk", "Build unified prediction pipelines"],
            theory: "Covers model export formats (pickle, joblib, ONNX), pipeline architectures, and input validations.",
            details: "Read on model storage, version controls, and encapsulation patterns.",
            practice: "Package preprocessing steps and trained model weights into a single exportable pipeline.",
            resource: { title: "ML Pipelines Guide", link: "https://scikit-learn.org/stable/modules/compose.html" },
            interviewQuestion: {
              question: "Why should we serialize preprocessing steps along with model weights?",
              answer: "To ensure that raw production data undergoes the exact same transformations as training data, avoiding feature skew."
            },
            resumeTip: "Encapsulated data engineering and models into deployment packages."
          },
          {
            day: 7,
            title: "Day 7: Staging REST API Deployment",
            contentType: "Final Capstone",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Build inference endpoints", "Deploy to containerized hosts"],
            theory: "Covers model hosting frameworks (FastAPI/Flask), inference latency, and request-response patterns.",
            details: "Examine routing setups, validation schemas, and staging deployment steps.",
            practice: "Build a REST API that serves predictions from your Day 6 pipeline and run local tests.",
            portfolioTask: "Deploy your model service to a cloud runtime (Render/AWS), link GitHub, and document endpoint schemas in the README.",
            interviewQuestion: {
              question: "How do you handle real-time prediction scaling in production environments?",
              answer: "By wrapping inference code in container runtimes, setting up load balancers, and utilizing horizontal pod auto-scalers."
            },
            resumeTip: "Deployed FastAPI machine learning endpoints, maintaining fast inference response times."
          }
        ],
        project: {
          title: "Predictive Analytics API Pipeline",
          description: "Build an end-to-end pipeline covering feature engineering, model tuning, serialization, and REST API deployments.",
          features: [
            "Preprocessing pipelines integrating column encoders",
            "Hyperparameter grid searches with automated cross-validation tests",
            "Interactive prediction endpoints with request-validation checks"
          ]
        }
      };

    case "Cloud":
      return {
        skill,
        overview: `A structured 7-day cloud syllabus to master ${skill} for ${role}.`,
        domain: "Cloud Architecture",
        learningOutcomes: [
          `Provision scalable cloud resources safely`,
          `Implement IAM access controls and security groups`,
          `Deploy serverless applications on public clouds`
        ],
        days: [
          {
            day: 1,
            title: `Day 1: ${skill} Infrastructure Basics & Global Architecture`,
            contentType: "Theory",
            estimatedTime: "2 hours",
            difficulty: "Beginner",
            learningObjectives: ["Describe Regions and Availability Zones", "Navigate the management console"],
            theory: "Deals with cloud deployment models, shared responsibility grids, global infrastructure, and compute instances.",
            details: "Read basic compute options, billing mechanisms, and regional availability guidelines.",
            practice: "Create a free-tier account, set up billing alarms, and inspect regional services.",
            resource: { title: "Cloud Architecture Whitepapers", link: "https://aws.amazon.com/whitepapers" },
            interviewQuestion: {
              question: "What is the shared responsibility model in cloud computing?",
              answer: "The provider is responsible for security 'of' the cloud (hardware, networking, physical facilities). The customer is responsible for security 'in' the cloud (data, OS, configurations, IAM)."
            },
            resumeTip: "Implemented global cloud infrastructures aligned with security best practices."
          },
          {
            day: 2,
            title: "Day 2: Compute Provisioning & Virtual Servers",
            contentType: "Hands-on Lab",
            estimatedTime: "3 hours",
            difficulty: "Beginner",
            learningObjectives: ["Launch virtual server instances", "Configure security group firewalls"],
            theory: "Examines virtual machines, storage attachments, key pairs, and ingress/egress network filters.",
            details: "Study machine images, compute sizes, network rules, and SSH keys.",
            practice: "Provision a virtual VM, configure HTTP ingress ports, and host a static web server.",
            resource: { title: "Compute Instance Basics", link: "https://docs.aws.amazon.com" },
            interviewQuestion: {
              question: "What is a Security Group in cloud environments?",
              answer: "A Security Group acts as a virtual firewall for compute instances, controlling inbound and outbound traffic at the instance level (stateful)."
            },
            resumeTip: "Provisioned virtual compute instances with restricted security filters."
          },
          {
            day: 3,
            title: "Day 3: Virtual Networks & Subnet Routing",
            contentType: "Industry Use Cases",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Set up isolated private networks", "Configure route tables and internet gateways"],
            theory: "Covers virtual private networks, public vs private subnets, routing tables, and network access control lists (NACLs).",
            details: "Study CIDR blocks, subnet masks, route paths, and network gateway topologies.",
            practice: "Construct a custom VPC with one public subnet (web server) and one private subnet (database).",
            resource: { title: "Cloud Networking Guides", link: "https://cloud.google.com/docs" },
            interviewQuestion: {
              question: "How does a Security Group differ from a Network ACL?",
              answer: "Security Groups are stateful firewalls applied at the instance level. NACLs are stateless firewalls applied at the subnet level."
            },
            resumeTip: "Designed secure isolated virtual private networks with segmented public/private subnets."
          },
          {
            day: 4,
            title: "Day 4: Cloud Storage Engines & CDN Integration",
            contentType: "Mini Project",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Configure object storage buckets", "Distribute assets using content delivery networks"],
            theory: "Deals with object vs block storage, IAM access control policies, encryption at rest, and edge caching techniques.",
            details: "Study storage classes, lifecycle policies, signed URLs, and CDN distribution properties.",
            practice: "Build a static website hosted in an object storage bucket, routed through a global CDN.",
            resource: { title: "Object Storage and CDN Guide", link: "https://developer.hashicorp.com" },
            interviewQuestion: {
              question: "Why use content delivery networks (CDNs) for asset distribution?",
              answer: "CDNs cache static content at edge locations closer to users, reducing latency and backend origin load."
            },
            resumeTip: "Optimized media delivery pipelines utilizing global CDN caching networks."
          },
          {
            day: 5,
            title: "Day 5: Identity Access Management (IAM) Policies",
            contentType: "Quiz & Tuning",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Draft IAM policies with least privilege", "Assume service-to-service roles"],
            theory: "Focuses on cloud security principles, policy variables, group mappings, and avoiding root-account configurations.",
            details: "Study JSON policies structure, conditions elements, and role assumptions.",
            practice: "Write an IAM policy that allows read-only access to a specific storage bucket, and attach it to a test user.",
            quiz: [
              {
                question: "Which IAM concept allows service authentication without hardcoded keys?",
                options: ["IAM Groups", "IAM Roles", "Access Keys", "Root Account"],
                correctOption: "IAM Roles"
              }
            ],
            interviewQuestion: {
              question: "Explain the Principle of Least Privilege in cloud environments.",
              answer: "Users and services must only be granted the minimum necessary permissions required to perform their specific tasks, and no more."
            },
            resumeTip: "Implemented IAM roles and least-privilege configurations, securing credentials."
          },
          {
            day: 6,
            title: "Day 6: Automated Infrastructure as Code (IaC)",
            contentType: "Portfolio Task",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Write infrastructure code blocks (Terraform)", "Execute infrastructure validation checks"],
            theory: "Covers declarative infrastructure frameworks, state files, plans generation, resource dependencies, and variables.",
            details: "Read on state management, resource blocks syntax, dynamic configurations, and outputs.",
            practice: "Write a Terraform template to provision a cloud compute instance and security network automatically.",
            resource: { title: "Terraform Tutorials", link: "https://learn.hashicorp.com" },
            interviewQuestion: {
              question: "What is Infrastructure as Code (IaC) and why is it important?",
              answer: "IaC automates infrastructure provisioning through configuration files. It ensures consistency, reproducibility, and version control for cloud assets."
            },
            resumeTip: "Authored Terraform templates, automating environment provisioning."
          },
          {
            day: 7,
            title: "Day 7: Serverless Deployment & Monitoring",
            contentType: "Final Capstone",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Deploy serverless compute functions", "Configure log collectors and alarms"],
            theory: "Explores serverless execution runtimes, API gateways, log integrations, alert thresholds, and performance metrics.",
            details: "Examine function triggers, cold starts, metric streams, and dashboard setups.",
            practice: "Deploy a serverless function triggered by HTTP endpoints and verify logging output.",
            portfolioTask: "Deploy a fully serverless API integrated with database systems, managed through IaC templates.",
            interviewQuestion: {
              question: "What are 'cold starts' in serverless functions?",
              answer: "Cold starts happen when a serverless function is invoked after inactivity, causing a delay while the provider initializes a new runtime environment."
            },
            resumeTip: "Engineered scalable serverless backends with automated log alerts."
          }
        ],
        project: {
          title: "Declarative Cloud Infrastructure Deployment",
          description: "Deploy a multi-service web app utilizing object storage, VPC subnets, serverless endpoints, and Terraform IaC.",
          features: [
            "Terraform IaC script provisioning compute and security resources",
            "Isolated networking configurations with subnets and internet gateways",
            "Serverless function endpoints connected to database clusters"
          ]
        }
      };

    case "Communication":
      return {
        skill,
        overview: `A structured 7-day interpersonal curriculum to master ${skill} for ${role}.`,
        domain: "Professional Communication",
        learningOutcomes: [
          `Structure clear, persuasive written and verbal arguments`,
          `Apply active listening techniques in collaborative settings`,
          `Navigate difficult conversations and conflicts constructively`
        ],
        days: [
          {
            day: 1,
            title: `Day 1: ${skill} Active Listening & Understanding`,
            contentType: "Theory",
            estimatedTime: "1.5 hours",
            difficulty: "Beginner",
            learningObjectives: ["Explain active listening phases", "Identify non-verbal cues"],
            theory: "Deals with processing cycles, feedback loops, body language patterns, and avoiding interruptions.",
            details: "Study the stages of hearing, understanding, remembering, evaluating, and responding.",
            practice: "Conduct a conversation where you only paraphrase and ask clarifying questions.",
            resource: { title: "Active Listening Basics", link: "https://www.coursera.org" },
            interviewQuestion: {
              question: "What is active listening and how do you demonstrate it in meetings?",
              answer: "Active listening is fully focusing, understanding, and responding to speakers. Demonstrated by paraphrasing, asking questions, and maintaining open body language."
            },
            resumeTip: "Facilitated collaborative cross-functional workshops using active listening methods."
          },
          {
            day: 2,
            title: "Day 2: Structuring Clear Message Foundations",
            contentType: "Hands-on Lab",
            estimatedTime: "2 hours",
            difficulty: "Beginner",
            learningObjectives: ["Apply the Minto Pyramid Principle", "Summarize complex details"],
            theory: "Examines top-down communication frameworks, starting with core answers followed by supporting premises.",
            details: "Read on structuring messages, grouping details logically, and eliminating fluff.",
            practice: "Rewrite a long email draft into a 3-bullet executive summary with a clear call-to-action.",
            resource: { title: "Pyramid Principle Guidelines", link: "https://hbr.org" },
            interviewQuestion: {
              question: "How do you explain complex technical details to non-technical stakeholders?",
              answer: "By avoiding jargon, using relatable analogies, focusing on business outcomes, and structuring the explanation with the conclusion first."
            },
            resumeTip: "Authored structured project proposals, streamlining stakeholder sign-offs."
          },
          {
            day: 3,
            title: "Day 3: Persuasion & Written Assertiveness",
            contentType: "Industry Use Cases",
            estimatedTime: "2 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Use persuasive copywriting structures", "Draft assertive feedback"],
            theory: "Covers influence triggers, assertive language cues, structure formats, and email etiquette rules.",
            details: "Read on rhetorical appeals (ethos, pathos, logos), avoiding passive-aggressive tone, and setting boundaries.",
            practice: "Draft a request for budget allocation using the Situation-Complication-Question-Answer template.",
            resource: { title: "Persuasive Business Writing", link: "https://www.linkedin.com/learning" },
            interviewQuestion: {
              question: "How do you handle writing a difficult feedback message to a peer?",
              answer: "By focusing strictly on objective behaviors and impact, using 'I' statements, and proposing constructive collaborative next steps."
            },
            resumeTip: "Composed persuasive case summaries, securing executive project approvals."
          },
          {
            day: 4,
            title: "Day 4: Public Presentation Delivery",
            contentType: "Mini Project",
            estimatedTime: "2.5 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Design clear slide narratives", "Manage speech pace and filler words"],
            theory: "Deals with narrative pacing, visual designs, vocal projection, eye contact, and managing nervous responses.",
            details: "Study narrative arcs, presentation patterns, slide design tips, and vocal controls.",
            practice: "Record a 3-minute video presentation explaining a project and review for filler words.",
            resource: { title: "Toastmasters Speech Manual", link: "https://www.toastmasters.org" },
            interviewQuestion: {
              question: "What is your process for preparing a high-stakes presentation?",
              answer: "Defining the core objective, structuring the narrative arc, creating clean visual aids, and practicing delivery while recording myself to check timing and clarity."
            },
            resumeTip: "Delivered presentations to client steering committees, securing client buy-in."
          },
          {
            day: 5,
            title: "Day 5: Managing Collaborative Feedback Sessions",
            contentType: "Quiz & Tuning",
            estimatedTime: "2 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Deliver constructive critique", "Receive criticism without defensiveness"],
            theory: "Focuses on psychological safety, feedback matrices, active listening in reviews, and behavior redirection.",
            details: "Study the sandwich method alternative, radical candor metrics, and validation techniques.",
            practice: "Simulate a peer review discussion focusing on positive reinforcement and clear actionable upgrades.",
            quiz: [
              {
                question: "Which communication model combines caring personally with challenging directly?",
                options: ["Aggressive", "Radical Candor", "Passive-Aggressive", "Manipulative"],
                correctOption: "Radical Candor"
              }
            ],
            interviewQuestion: {
              question: "How do you react when someone gives you negative feedback?",
              answer: "I listen without interrupting, ask clarifying questions to understand their perspective, thank them for the feedback, and outline action steps to improve."
            },
            resumeTip: "Implemented peer feedback loops, boosting team alignment."
          },
          {
            day: 6,
            title: "Day 6: Negotiation & Boundary Setting",
            contentType: "Portfolio Task",
            estimatedTime: "3 hours",
            difficulty: "Advanced",
            learningObjectives: ["Identify win-win scenarios", "Assertively establish boundaries"],
            theory: "Covers principled negotiation strategies, identifying BATNAs, managing emotional reactions, and framing compromises.",
            details: "Read on interest-based bargaining, handling objections, and establishing clear boundaries.",
            practice: "Script a conversation negotiating project timelines with cross-functional partners.",
            resource: { title: "Getting to Yes Guide", link: "https://www.pon.harvard.edu" },
            interviewQuestion: {
              question: "Tell me about a time you had to negotiate a timeline change with a client.",
              answer: "I presented data on current scope, outlined options with pros/cons, and aligned on a phased delivery schedule that maintained quality without burning out the team."
            },
            resumeTip: "Negotiated project scope modifications with clients, preventing creep."
          },
          {
            day: 7,
            title: "Day 7: Crisis Messaging & Leadership Pitch",
            contentType: "Final Capstone",
            estimatedTime: "3 hours",
            difficulty: "Advanced",
            learningObjectives: ["Draft crisis communication memos", "Deliver executive elevation pitches"],
            theory: "Explores crisis control grids, post-incident communications, executive briefings, and managing message channels.",
            details: "Examine incident response frameworks, public relations, tone adjustments, and brevity.",
            practice: "Write an incident recovery email explaining a downtime event and next preventative actions.",
            portfolioTask: "Publish a Communication Portfolio containing written proposals, crisis memos, and case designs.",
            interviewQuestion: {
              question: "How do you handle communicating a project delay to your manager?",
              answer: "By flagging it early, explaining the root cause, presenting potential solutions, and detailing the revised delivery timeline."
            },
            resumeTip: "Drafted communication strategies for critical server downtime notifications, retaining customer trust."
          }
        ],
        project: {
          title: "Professional Stakeholder Communication Suite",
          description: "Develop a communication case portfolio containing project proposals, executive briefs, and incident response drafts.",
          features: [
            "Project request brief using the Pyramid Principle structure",
            "Post-incident customer notification memo explaining technical downtime",
            "Stakeholder alignment presentation deck outlining resource constraints"
          ]
        }
      };

    case "Leadership":
      return {
        skill,
        overview: `A structured 7-day leadership course to master ${skill} for ${role}.`,
        domain: "Leadership & Management",
        learningOutcomes: [
          `Delegate tasks and manage team deliverables effectively`,
          `Foster a culture of accountability and psychological safety`,
          `Drive strategic alignment and execute operational goals`
        ],
        days: [
          {
            day: 1,
            title: `Day 1: ${skill} Styles & Situational Leadership`,
            contentType: "Theory",
            estimatedTime: "2 hours",
            difficulty: "Beginner",
            learningObjectives: ["Differentiate leadership frameworks", "Assess team maturity levels"],
            theory: "Deals with authoritative, democratic, coaching, and delegative leadership models, matching styles to team readiness.",
            details: "Read on situational leadership matrices, task maturity assessments, and leadership behaviors.",
            practice: "Audit your team members' task maturities and write down the corresponding leadership style for each.",
            resource: { title: "Situational Leadership Basics", link: "https://hbr.org" },
            interviewQuestion: {
              question: "How would you describe your leadership style?",
              answer: "I practice situational leadership, adapting my approach from directive coaching for new tasks to autonomy and delegation for experienced team members."
            },
            resumeTip: "Led cross-functional teams utilizing situational management frameworks."
          },
          {
            day: 2,
            title: "Day 2: Delegation & Task Accountability",
            contentType: "Hands-on Lab",
            estimatedTime: "2.5 hours",
            difficulty: "Beginner",
            learningObjectives: ["Write clear task delegation scopes", "Set up accountability checks"],
            theory: "Examines task assignment methods, setting clear outcome expectations, defining boundaries, and establishing review points.",
            details: "Study delegation frameworks (who, what, when, how), feedback frequency, and measuring success.",
            practice: "Draft a delegation memo detailing a project task, including scope, deadlines, and checking intervals.",
            resource: { title: "Effective Delegation Methods", link: "https://www.scrumalliance.org" },
            interviewQuestion: {
              question: "How do you ensure a task you delegated is completed successfully without micromanaging?",
              answer: "By aligning on expected outcomes, establishing checkpoints for milestones, and providing resources while leaving the execution paths to them."
            },
            resumeTip: "Delegated core development tasks, increasing overall team productivity by 20%."
          },
          {
            day: 3,
            title: "Day 3: Building Trust & Psychological Safety",
            contentType: "Industry Use Cases",
            estimatedTime: "2 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Foster psychological safety in reviews", "Run blameless post-mortem reviews"],
            theory: "Covers trust dynamics, vulnerability, psychological safety indicators, and separating execution failure from experimentation.",
            details: "Read about team safety models, run-throughs of feedback reviews, and blameless analysis formats.",
            practice: "Write an agenda for a project review session focusing on learnings rather than assigning individual blame.",
            resource: { title: "Google Project Aristotle Findings", link: "https://rework.withgoogle.com" },
            interviewQuestion: {
              question: "What is psychological safety and why does it matter for teams?",
              answer: "Psychological safety is the belief that one will not be punished for speaking up, asking questions, or making mistakes. It is crucial for innovation and risk-taking."
            },
            resumeTip: "Cultivated a culture of psychological safety, resulting in a reduction in team turnover."
          },
          {
            day: 4,
            title: "Day 4: Conflict Resolution & Team Alignment",
            contentType: "Mini Project",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Resolve interpersonal team disputes", "Align team goals with company strategies"],
            theory: "Deals with the Thomas-Kilmann conflict model, negotiating compromises, and translating corporate goals into team targets.",
            details: "Study competing, collaborating, compromising, avoiding, and accommodating modes of conflict resolution.",
            practice: "Role-play a scenario resolving a dispute between a designer and developer regarding feature prioritization.",
            resource: { title: "Thomas-Kilmann Conflict Resolution", link: "https://www.kilmanndiagnostics.com" },
            interviewQuestion: {
              question: "Tell me about a time you resolved a major conflict on your team.",
              answer: "I gathered the parties, listened to both viewpoints, identified common ground, and helped them align on a hybrid solution that satisfied project goals."
            },
            resumeTip: "Mediated technical disputes between departments, maintaining project momentum."
          },
          {
            day: 5,
            title: "Day 5: Performance Appraisals & Coaching Conversations",
            contentType: "Quiz & Tuning",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Structure performance feedback reviews", "Coach team members through roadblocks"],
            theory: "Focuses on coaching frameworks (GROW model), performance metrics, writing development plans, and addressing performance gaps.",
            details: "Study the GROW model (Goal, Reality, Options, Will), rating systems, and constructing development trackers.",
            practice: "Draft a performance coaching plan for a team member struggling with code delivery timelines.",
            quiz: [
              {
                question: "What does the R stand for in the GROW coaching model?",
                options: ["Responsibility", "Reality", "Result", "Requirements"],
                correctOption: "Reality"
              }
            ],
            interviewQuestion: {
              question: "How do you handle a team member who is underperforming?",
              answer: "I initiate a private discussion to understand root causes, define clear expectations, establish a supportive action plan, and review progress weekly."
            },
            resumeTip: "Coached junior engineers, accelerating their progression to mid-level roles."
          },
          {
            day: 6,
            title: "Day 6: Strategic Roadmapping & Resource Management",
            contentType: "Portfolio Task",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Build strategic project roadmaps", "Estimate resource allocation constraints"],
            theory: "Covers capacity planning, forecasting workloads, managing project budgets, and identifying delivery bottlenecks.",
            details: "Read about project gantt charts, estimation methods, capacity velocity calculations, and resource allocations.",
            practice: "Build a quarterly delivery roadmap for a team of 5, accounting for holidays and dependencies.",
            resource: { title: "Agile Project Planning Guides", link: "https://www.pmi.org" },
            interviewQuestion: {
              question: "How do you estimate team capacity for a major project release?",
              answer: "By analyzing historical velocity, accounting for planned leaves, assessing task complexities, and adding buffer contingencies for unexpected issues."
            },
            resumeTip: "Authored project roadmaps, ensuring on-time delivery of major releases."
          },
          {
            day: 7,
            title: "Day 7: Change Management & Staging Execution",
            contentType: "Final Capstone",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Manage team transitions during changes", "Pitch strategic initiatives to senior management"],
            theory: "Explores change management frameworks (Kotter's 8-step), communication plans during restructuring, and corporate pitches.",
            details: "Examine change urgency, building coalitions, communications channels, and stakeholder alignments.",
            practice: "Draft a change communication memo explaining the migration to a new tooling platform to your team.",
            portfolioTask: "Prepare a leadership portfolio package containing team roadmaps, coaching plans, and delegation matrices.",
            interviewQuestion: {
              question: "How do you lead a team through a period of organizational change?",
              answer: "By communicating the vision transparently, explaining the 'why' behind the change, addressing concerns directly, and celebrating early wins."
            },
            resumeTip: "Guided engineering teams through a corporate transition, keeping disruption minimal."
          }
        ],
        project: {
          title: "Engineering Team Leadership Blueprint",
          description: "Develop a complete management blueprint containing team capacity roadmaps, delegation frameworks, and change plans.",
          features: [
            "Quarterly team capacity roadmap with task estimations and dependencies",
            "Coaching plan leveraging the GROW model for performance improvement",
            "Change management communications memo outlining a tooling migration"
          ]
        }
      };

    default:
      // Generic technical / engineering fallback template
      return {
        skill,
        overview: `A progressive 7-day curriculum to master ${skill} for ${role}.`,
        domain: "General Engineering",
        learningOutcomes: [
          `Proficiency in core concepts of ${skill}`,
          `Ability to integrate ${skill} into professional systems`,
          `Ready-to-deploy portfolio project demonstrating hands-on implementation`
        ],
        days: [
          {
            day: 1,
            title: `Day 1: ${skill} Fundamentals & Core Architecture`,
            contentType: "Theory",
            estimatedTime: "2 hours",
            difficulty: "Beginner",
            learningObjectives: [`Explain core architecture of ${skill}`, "Setup basic running systems"],
            theory: `Focuses on the primary fundamentals. Learn the architectural principles, modules, and core patterns of ${skill}.`,
            details: `Read up on initial configurations, documentation guides, and standard setups.`,
            practice: `Configure a local test sandbox and verify the development setup runs cleanly.`,
            resource: { title: `${skill} Core Docs`, link: "https://example.com" },
            interviewQuestion: {
              question: `What is the primary design pattern used in ${skill}?`,
              answer: "It depends on the framework, but typically involves modular separation of concerns and unified configuration patterns."
            },
            resumeTip: `Designed and integrated a robust ${skill} model into the project workflow.`
          },
          {
            day: 2,
            title: "Day 2: Core Operations & Syntax Basics",
            contentType: "Hands-on Lab",
            estimatedTime: "2.5 hours",
            difficulty: "Beginner",
            learningObjectives: ["Write operations scripts", "Debug basic setup variables"],
            theory: "Deals with the primary operators, configuration files, syntax structures, and setup properties.",
            details: "Study variable injections, scripting formats, and basic logic modules.",
            practice: "Write a startup script that initializes values and runs a validation check.",
            resource: { title: "Syntax & Setup Guides", link: "https://example.com" },
            interviewQuestion: {
              question: "Explain the setup configuration settings.",
              answer: "They define how the engine initializes connections, memory boundaries, and execution environments."
            },
            resumeTip: "Authored system script setups, reducing manual configurations."
          },
          {
            day: 3,
            title: "Day 3: Intermediate Workflows & Gotchas",
            contentType: "Industry Use Cases",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Handle common error codes", "Configure intermediate logic modules"],
            theory: "Covers error categories, debug diagnostics, common setup problems, and performance variables.",
            details: "Read on connection limits, memory management, and diagnostic outputs.",
            practice: "Simulate service disconnect errors and implement retry logic routines.",
            resource: { title: "Troubleshooting Case Studies", link: "https://example.com" },
            interviewQuestion: {
              question: "How do you troubleshoot connection drops?",
              answer: "By verifying network routes, checking timeout parameters, and reviewing server resource logs."
            },
            resumeTip: "Integrated error isolation routines, reducing service dropouts."
          },
          {
            day: 4,
            title: "Day 4: Core Integrations & API Connections",
            contentType: "Mini Project",
            estimatedTime: "3.5 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Connect API endpoints", "Map data representations"],
            theory: "Deals with data serialization, requesting external APIs, and payload serialization techniques.",
            details: "Study data transformation structures, parsing schemas, and token parameters.",
            practice: "Build a middle tier agent that transforms inputs and posts data to remote endpoints.",
            resource: { title: "Integrations Patterns", link: "https://example.com" },
            interviewQuestion: {
              question: "Why serialize data structures?",
              answer: "To convert variables into flat byte arrays that can be transmitted over networks or saved to disk."
            },
            resumeTip: "Engineered system integrations, accelerating data transfer speeds."
          },
          {
            day: 5,
            title: "Day 5: Performance Auditing & Tuning",
            contentType: "Quiz & Tuning",
            estimatedTime: "3 hours",
            difficulty: "Intermediate",
            learningObjectives: ["Run load audit monitors", "Optimize runtime bottlenecks"],
            theory: "Deals with latency measurements, memory allocations, caching systems, and execution benchmarks.",
            details: "Read on profiles, diagnostic parameters, thread executions, and query times.",
            practice: "Profile a run loop, locate heavy execution blocks, and apply caching strategies.",
            quiz: [
              {
                question: "Which strategy optimizes database lookup speeds?",
                options: ["De-normalization", "Indexing", "Garbage collection", "Load balancing"],
                correctOption: "Indexing"
              }
            ],
            interviewQuestion: {
              question: "Explain the importance of caching strategies.",
              answer: "Caching stores computed outputs in memory, avoiding redundant executions and database reads."
            },
            resumeTip: "Optimized runtime configurations, reducing latency metrics."
          },
          {
            day: 6,
            title: "Day 6: Automated Testing & Verification",
            contentType: "Portfolio Task",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Write unit logic tests", "Verify boundary conditions"],
            theory: "Covers automated unit tests, mocking classes, testing setups, and boundary checks.",
            details: "Study test assertions, mocks, configuration options, and runners.",
            practice: "Write unit tests targeting your helper models and integrations.",
            resource: { title: "Testing Manuals", link: "https://example.com" },
            interviewQuestion: {
              question: "What is mock objects in test environments?",
              answer: "Mock objects mimic production dependencies, allowing logic tests to run independently of databases or networks."
            },
            resumeTip: "Achieved high test coverage on core integration points."
          },
          {
            day: 7,
            title: "Day 7: Capstone Project Deployment",
            contentType: "Final Capstone",
            estimatedTime: "4 hours",
            difficulty: "Advanced",
            learningObjectives: ["Deploy staging assets", "Configure production settings"],
            theory: "Explores deploying setups, compiling release builds, security parameters, and monitoring active runs.",
            details: "Examine deploy paths, ports mappings, environments, and recovery scripts.",
            practice: "Deploy the integrated capstone script to a cloud runtime environment.",
            portfolioTask: "Release your completed code repository to GitHub with complete setup instructions in the README.",
            interviewQuestion: {
              question: "How do you manage configurations securely in production?",
              answer: "By storing secrets in environment variables or vault keys, keeping them outside the codebase."
            },
            resumeTip: "Managed production deployments, ensuring service availability."
          }
        ],
        project: {
          title: "Complete System Integration Suite",
          description: "Build an application integrating setup configurations, API endpoints, logic tests, and deployment setups.",
          features: [
            "Unified configuration structures with environment bindings",
            "Integrated unit testing suites validating execution logic",
            "Automated setup script launching sandbox nodes"
          ]
        }
      };
  }
};
