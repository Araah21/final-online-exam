const exams = {
    ais: {
        title: "Accounting Information System",
        parts: [
            {
                title: "Part I: Multiple Choice",
                questions: [
                    { q: "Which of the following is a primary reason for documenting an accounting information system?", o: ["To increase the complexity of the system.", "To satisfy the requirements of Sarbanes-Oxley for maintaining adequate internal controls.", "To decrease the need for system audits.", "To ensure that all data is processed in batches."], a: "B" },
                    { q: "According to the provided text, which documentation technique is used to represent the relationship between entities such as physical resources, events, and agents?", o: ["Data Flow Diagram (DFD)", "System Flowchart", "Program Flowchart", "Entity-Relationship (ER) Diagram"], a: "D" },
                    { q: "In a Data Flow Diagram (DFD), what does a square symbol represent?", o: ["A process that transforms data.", "A store or repository of data.", "The direction of data flow.", "A source of data or a destination for data."], a: "D" },
                    { q: "Which of the following statements is true about Data Flow Diagrams?", o: ["They represent the physical layout of the system.", "They show how tasks are performed and by whom.", "They illustrate the logical tasks that a system performs.", "They are primarily used to model the timing of processes."], a: "C" },
                    { q: "In the context of a DFD, which of the following would be considered an \"external entity\"?", o: ["The process of updating inventory records.", "A customer placing an order.", "The accounts receivable master file.", "The flow of a sales order to the credit department."], a: "B" },
                    { q: "What does a labeled arrow in a Data Flow Diagram represent?", o: ["A data store.", "A data flow.", "A process.", "An entity."], a: "B" },
                    { q: "In the \"Data Flow Diagram of Sales Order Processing System\" (Figure 2-13), which of the following is depicted as a process?", o: ["Customer", "Shipping File", "Approve Credit", "Carrier"], a: "C" },
                    { q: "According to the DFD symbol set (Figure 2-12), what does a rectangle with rounded corners represent?", o: ["A data store.", "A data source or destination.", "A process or transformation.", "A physical document."], a: "C" },
                    { q: "What is the primary characteristic of a batch processing system with real-time data collection?", o: ["Transactions are processed individually as they occur.", "Data is captured as the transaction happens, but processing is delayed.", "Data is collected and processed entirely manually.", "Real-time financial statements are generated with every transaction."], a: "B" },
                    { q: "In the flowchart for \"Batch Processing with Real-Time Data Collection\" (Figure 2-31), where does the initial data input occur?", o: ["In the Computer Operations department.", "In the Sales Department, via a terminal.", "In the warehouse when goods are picked.", "In the Billing Department when the invoice is created."], a: "B" },
                    { q: "A system flowchart is used to:", o: ["Show the logical flow of data.", "Represent the physical aspects of a system, including the areas of activity.", "Detail the programming logic of a single program.", "Illustrate the relationships between different entities in a database."], a: "B" },
                    { q: "The \"Approve Credit\" process would most likely access which data store to perform its function?", o: ["Inventory File", "Customer File", "Shipping File", "Sales Order File"], a: "B" },
                    { q: "What is the function of the \"Update Program\" in the \"Batch Processing using Real-Time Data Collection\" diagram (Figure 2-31)?", o: ["To immediately update the master file upon data entry.", "To process a batch of transactions to update the master file.", "To create real-time reports for management.", "To back up the transaction file."], a: "B" },
                    { q: "The concept of \"laying out the physical areas of activity\" in separate columns is most closely associated with which documentation technique?", o: ["Entity-Relationship Diagram", "Data Flow Diagram", "System Flowchart", "Data Dictionary"], a: "C" },
                    { q: "In a DFD, the process of \"Bill Customer\" in the sales order system would logically result in a data flow to which external entity?", o: ["Sales Department", "Shipping Department", "Customer", "Carrier"], a: "C" },
                    { q: "Which symbol in a DFD represents a store of data such as a transaction file or a master file?", o: ["A square.", "A circle or rounded rectangle.", "An open-ended rectangle.", "An arrow."], a: "C" },
                    { q: "The primary difference between a DFD and a flowchart is that:", o: ["A DFD is more detailed than a flowchart.", "A flowchart shows the physical system, while a DFD shows the logical system.", "Only DFDs are used in accounting systems.", "Flowcharts do not show manual processes."], a: "B" },
                    { q: "In a batch processing system, why is a batch of transactions collected before processing?", o: ["To increase the cost of processing.", "To provide more up-to-the-minute information.", "For efficiency and control purposes.", "Because real-time processing is not technologically possible."], a: "C" },
                    { q: "Which of the following is NOT a documentation technique mentioned in the first paragraph of the provided text?", o: ["Data Flow Diagrams", "System Flowcharts", "Mind Maps", "Entity-Relationship Diagrams"], a: "C" },
                    { q: "The \"Carrier\" in the \"Data Flow Diagram of Sales Order Processing System\" is an example of a(n):", o: ["Process", "Data Store", "Data Flow", "External Entity (Destination)"], a: "D" },
                    { q: "In the \"Batch Processing with Real-Time Data Collection\" system, the \"Sales Order File (trans.)\" serves as a:", o: ["Master file containing permanent customer data.", "Temporary file holding transactions before processing.", "Backup of the inventory master file.", "Log of all system errors."], a: "B" },
                    { q: "What does the term \"real-time data collection\" imply?", o: ["Data is processed the instant it is collected.", "Data is captured electronically at its source as it occurs.", "Data is collected on paper and then scanned in real-time.", "The system provides real-time financial feedback to the user."], a: "B" },
                    { q: "Checking a customer's credit status from a master file is an example of what kind of process?", o: ["Data input", "Data verification/authorization", "Data storage", "Data distribution"], a: "B" },
                    { q: "In the batch processing diagram (Figure 2-31), the \"AR Sub. Ledger\" and \"Inv. Sub. Ledger\" represent:", o: ["Transaction files", "Master files", "External entities", "System programs"], a: "B" },
                    { q: "The process of \"Prepare Shipping Notice\" in the DFD (Figure 2-13) would be triggered by a data flow coming from which process?", o: ["\"Approve Credit\"", " \"Bill Customer\"", "\"Ship Goods\"", "\"Update Inventory Records\""], a: "C" },
                    { q: "An auditor would primarily use system documentation to:", o: ["Understand the system of internal controls.", "Write new code for the system.", "Design a new database structure.", "Train new employees in data entry."], a: "A" },
                    { q: "The text states that using flowcharts to represent the physical accounting system, whether manual or computer-based, is a modern interpretation of the term.", o: ["Only computerized systems.", "The physical accounting system, whether manual or computer-based.", "Only manual recording and posting activities.", "The logical flow of data, similar to a DFD."], a: "B" },
                    { q: "The final output of the batch processing run depicted in Figure 2-31 includes:", o: ["Real-time sales analytics.", "Updated master files (AR and Inventory).", "An immediate shipping notification to the customer.", "A credit approval message to the sales clerk."], a: "B" },
                    { q: "If you wanted to understand which departments are responsible for which tasks in a process, which diagram would be most useful?", o: ["A context-level Data Flow Diagram.", "An Entity-Relationship Diagram.", "A System Flowchart showing areas of activity.", "A Program Flowchart."], a: "C" },
                    { q: "The overall purpose of the various documentation techniques described is to:", o: ["Create a common and understandable language for describing a system.", "Prove that a system is 100% secure.", "Eliminate the need for human oversight in accounting.", "Speed up transaction processing to be exclusively real-time."], a: "A" }
                ]
            },
            {
                title: "Part II: True or False",
                questions: [
                    { q: "Data Flow Diagrams are very applicable when it comes to documenting existing systems because they are easy to prepare and revise.", a: "True" },
                    { q: "In a DFD, two external entities can be directly connected by a data flow line.", a: "False" },
                    { q: "A system flowchart focuses on the logical flow of data rather than the physical implementation of the system.", a: "False" },
                    { q: "The symbol for a data store in a DFD is a circle.", a: "False" },
                    { q: "Batch processing means that transactions are processed at the exact moment they occur.", a: "False" },
                    { q: "An Entity-Relationship Diagram is used to show the flow of data through a system's processes.", a: "False" },
                    { q: "In the provided DFD example (Figure 2-13), \"Sales Order\" is a type of data flow.", a: "True" },
                    { q: "The Sarbanes-Oxley Act has increased the importance of system documentation for assessing internal controls.", a: "True" },
                    { q: "Real-time data collection requires that data is immediately processed to update master files.", a: "False" },
                    { q: "A DFD can be used to represent both manual and computerized processes within a system.", a: "True" },
                    { q: "In the batch processing flowchart (Figure 2-31), data is entered by the Computer Operations department.", a: "False" },
                    { q: "The \"Customer\" is considered an internal entity within the sales order processing system.", a: "False" },
                    { q: "A flowchart can be organized into columns to denote different areas of activity or departments.", a: "True" },
                    { q: "The purpose of a backup and recovery system, as shown in Figure 2-30, is to ensure data can be restored in case of a system failure.", a: "True" },
                    { q: "According to the provided text, DFDs are an excellent tool for describing the physical devices used in a system.", a: "False" },
                    { q: "A transaction file is a permanent file of records that stores cumulative data about an organization's resources.", a: "False" },
                    { q: "In the DFD for sales order processing, \"Carrier\" is a destination for the data flow \"Shipping Notice\".", a: "True" },
                    { q: "The process of updating the Accounts Receivable (AR) Subsidiary Ledger happens in real-time in the system described in Figure 2-31.", a: "False" },
                    { q: "Program flowcharts and system flowcharts are identical in purpose and level of detail.", a: "False" },
                    { q: "Documentation is primarily for system designers and is rarely used by accountants or auditors.", a: "False" }
                ]
            }
        ]
    },
    nos: {
        title: "Network Operating System",
        parts: [
            {
                title: "Part I: Multiple Choice",
                questions: [
                    { q: "What is the most significant difference between the Windows Server 2019 Standard and Datacenter editions?", o: ["Datacenter has a graphical user interface (GUI), while Standard does not.", "Standard is cheaper and allows for 2 virtual machines, while Datacenter is more expensive and allows for unlimited virtual machines.", "Datacenter includes Windows Defender, but Standard requires a third-party antivirus.", "Standard is for cloud-based servers, while Datacenter is for on-premises servers."], a: "B" },
                    { q: "Which Windows Server installation option provides a full graphical user interface (GUI), including a desktop and Start menu?", o: ["Server Core", "Nano Server", "Desktop Experience", "Hyper-Converged Infrastructure"], a: "C" },
                    { q: "Which Windows utility would you use to view system logs and diagnose issues by checking for errors and warnings?", o: ["Task Manager", "Control Panel", "Event Viewer", "File Explorer"], a: "C" },
                    { q: "In a Linux Network Operating System (NOS), which service is used to provide file sharing interoperability with Windows systems?", o: ["NFS (Network File System)", "Samba (SMB/CIFS)", "Apache", "iptables"], a: "B" },
                    { q: "What is the primary function of the DNS (Domain Name System) protocol?", o: ["To automatically assign IP addresses to devices on a network.", "To transfer files between a client and a server.", "To translate human-readable domain names (e.g., google.com) into IP addresses.", "To create a secure, encrypted connection for remote access."], a: "C" },
                    { q: "If an administrator wants to use a powerful, text-based scripting and automation tool for managing Windows, which utility should they use?", o: ["Command Prompt (CMD)", "PowerShell", "Registry Editor", "Task Manager"], a: "B" },
                    { q: "Which security feature in Windows prevents unauthorized applications from making changes to the system without the user's permission?", o: ["BitLocker", "User Account Control (UAC)", "Windows Defender", "Group Policy"], a: "B" },
                    { q: "An administrator needs to remotely manage a Linux server using a secure, encrypted command-line interface. Which protocol is best suited for this task?", o: ["FTP (File Transfer Protocol)", "RDP (Remote Desktop Protocol)", "SNMP (Simple Network Management Protocol)", "SSH (Secure Shell Protocol)"], a: "D" },
                    { q: "What is Active Directory (AD) primarily used for?", o: ["Encrypting hard drives to protect data.", "Managing users, computers, and resources in an enterprise network.", "Navigating and managing files and folders.", "Monitoring system performance and running applications."], a: "B" },
                    { q: "According to the text, the Server Core installation option is described as \"headless.\" What does this mean?", o: ["It can only be installed on servers without monitors.", "It lacks a graphical user interface (GUI).", "It does not require a product key for activation.", "It consumes more system resources than the Desktop Experience."], a: "B" },
                    { q: "Which of the following is considered the foundational protocol of the internet, ensuring reliable data delivery between devices?", o: ["DHCP", "DNS", "TCP/IP", "HTTP"], a: "C" },
                    { q: "Which Linux distribution is noted for being user-friendly with large community support, making it a popular choice for a NOS?", o: ["Debian", "CentOS Stream", "SUSE Linux Enterprise Server (SLES)", "Ubuntu Server"], a: "D" },
                    { q: "The feature in Windows that allows an administrator to enforce security and configuration settings across multiple systems in a domain is known as:", o: ["System Restore", "Group Policy", "User Account Control (UAC)", "BitLocker"], a: "B" },
                    { q: "What is the main purpose of a VPN (Virtual Private Network)?", o: ["To monitor network device performance.", "To host websites and web applications.", "To create a secure, encrypted connection over a public network.", "To automatically assign IP addresses."], a: "C" },
                    { q: "The database that stores low-level system configurations, settings, and options in Windows is called the:", o: ["Control Panel", "Registry", "System Log", "Active Directory"], a: "B" },
                    { q: "Which web server software is commonly used on a Linux NOS to host websites?", o: ["Samba", "MySQL", "Apache or Nginx", "Snort"], a: "C" },
                    { q: "The Windows Admin Center (WAC) is described as a:", o: ["Replacement for the Control Panel.", "Locally deployed, browser-based app for managing servers.", "Security tool for blocking banned passwords.", "Feature exclusive to the Datacenter edition."], a: "B" },
                    { q: "What is the function of the DHCP (Dynamic Host Configuration Protocol)?", o: ["To secure web Browse with encryption.", "To translate domain names to IP addresses.", "To automatically assign IP addresses and network settings to devices.", "To remotely access a Windows desktop."], a: "C" },
                    { q: "Which technology allows you to run multiple independent operating systems on a single piece of physical hardware?", o: ["RAID (Redundant Array of Independent Disks)", "Hyper-V (Virtualization)", "Banned Passwords", "Windows Defender ATP"], a: "B" },
                    { q: "A small office network where all computers are peers and there is no central server for authentication is known as a:", o: ["Domain", "Workgroup", "Subnet", "Hyper-Converged Infrastructure"], a: "B" },
                    { q: "What is the standard file system used by modern Windows operating systems?", o: ["FAT32", "exFAT", "NFS", "NTFS"], a: "D" },
                    { q: "In the context of SNMP, what is the role of the MIB (Management Information Base)?", o: ["It is the manager that collects data.", "It is the agent installed on network devices.", "It is a database that stores the performance data collected by SNMP.", "It is the protocol used for data transfer."], a: "C" },
                    { q: "The public cloud is often described as magic because:", o: ["It requires no physical hardware.", "Resources are instantly available and you only pay for what you use.", "It is completely managed by AI.", "It uses a different internet protocol than on-premises servers."], a: "B" },
                    { q: "Which Linux service is specifically designed for file sharing within native Linux/UNIX environments?", o: ["Samba", "NFS (Network File System)", "FreeIPA", "LVM (Logical Volume Manager)"], a: "B" },
                    { q: "The protocol that allows a user to access and control a Windows machine remotely with a full graphical interface is:", o: ["SSH", "FTP", "RDP", "SNMP"], a: "C" },
                    { q: "Which of the following is an example of an Intrusion Detection System (IDS) used in a Linux NOS for security monitoring?", o: ["UFW (Uncomplicated Firewall)", "Syslog", "Snort or Suricata", "PostgreSQL"], a: "C" },
                    { q: "The term Hyper-Converged Infrastructure (HCI) refers to:", o: ["A single server running multiple websites.", "Software that combines compute, storage, and networking into a single, integrated solution.", "A new version of the Windows Taskbar.", "A method for encrypting virtual machines."], a: "B" },
                    { q: "The modern interface for configuring options in Windows 10 and Windows Server, intended to eventually replace the Control Panel, is the:", o: ["Settings App", "File Explorer", "Command Prompt", "Event Viewer"], a: "A" },
                    { q: "Which Linux distribution is described as being extremely stable and secure, making it a preferred choice for long-term support environments?", o: ["Ubuntu Server", "CentOS Stream", "Debian", "RHEL"], a: "C" },
                    { q: "The purpose of Windows Defender Advanced Threat Protection (ATP) is to:", o: ["Encrypt the entire operating system drive.", "Block users from choosing common or compromised passwords.", "Provide a platform for detecting, investigating, and responding to advanced security threats.", "Manage user access permissions through Group Policy."], a: "C" }
                ]
            },
            {
                title: "Part II: True or False",
                questions: [
                    { q: "Server Core is an installation option for Windows Server that includes the full graphical desktop environment.", a: "False" },
                    { q: "Active Directory is a directory service used for managing users and computers in small, peer-to-peer workgroups.", a: "False" },
                    { q: "The TCP/IP protocol suite is the fundamental basis for communication over the internet.", a: "True" },
                    { q: "A VPN is primarily used to monitor and manage the performance of network devices like routers and switches.", a: "False" },
                    { q: "The Windows Registry is a simple text file that can be safely edited by any user to change system colors.", a: "False" },
                    { q: "In a Linux NOS, Samba is used to facilitate file and print sharing with Linux-native systems, while NFS is used for Windows systems.", a: "False" },
                    { q: "DHCP is a protocol that manually assigns a permanent, unchanging IP address to every device on a network.", a: "False" },
                    { q: "BitLocker is a Windows tool used for encrypting entire disk volumes to protect data from unauthorized access.", a: "True" },
                    { q: "Windows Admin Center (WAC) is a cloud-based service that requires a monthly subscription.", a: "False" },
                    { q: "PowerShell is considered a more advanced and powerful command-line tool than the traditional Command Prompt (CMD).", a: "True" },
                    { q: "Hyper-V is Microsoft's virtualization technology that allows you to create and manage virtual machines.", a: "True" },
                    { q: "The FTP protocol provides a secure, encrypted method for remote server administration.", a: "False" },
                    { q: "Group Policy can be used by an administrator to enforce security rules, such as password complexity requirements, across a domain.", a: "True" },
                    { q: "The Windows Server Datacenter edition is the cheaper option and is intended for small businesses with minimal virtualization needs.", a: "False" },
                    { q: "RDP (Remote Desktop Protocol) provides secure, encrypted command-line access to a server.", a: "False" },
                    { q: "Ubuntu Server and Debian are examples of Linux distributions that can be used as a Network Operating System.", a: "True" },
                    { q: "Task Manager is the primary tool for navigating and managing files and folders in Windows.", a: "False" },
                    { q: "A public cloud service allows organizations to use computing resources without owning the underlying physical infrastructure.", a: "True" },
                    { q: "HTTPS is the secure version of HTTP, using encryption to protect data transmitted during web Browse.", a: "True" },
                    { q: "Nano Server is a tiny, remotely-managed installation option for Windows Server that is optimized for running containers.", a: "True" }
                ]
            }
        ]
    }
};