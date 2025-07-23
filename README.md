# Log Parsing and Visualization Project

## Overview

This project was developed as part of my internship at Ampere. It focuses on parsing large sets of logs to identify and extract key patterns. Using these key logs, the project visualizes communication sequences between various components such as MCU, QNX, RBVM, and FVM. The visualization is done with Mermaid diagrams to provide clear and interactive sequence diagrams.

## Features

- **Log Parsing:** Scans input log files to detect specific patterns and extract important log entries.
- **Sequence Diagram Visualization:** Displays communication flows between MCU, QNX, RBVM, and FVM using Mermaid syntax.
- **Statistics and KPIs:** Calculates and presents various statistics and key performance indicators based on the parsed logs.
- **Input File Handling:** Supports multiple input log files and combines data for comprehensive analysis.
- **Next.js Frontend:** Built with Next.js for a modern, reactive user interface that presents data, diagrams, and statistics clearly.

## Components

- **Log Parser:** Core engine that reads and processes log files to filter relevant data.
- **Mermaid Diagram Generator:** Translates filtered logs into Mermaid-compatible sequence diagrams.
- **Statistics Module:** Computes KPIs and other useful metrics from log data.
- **UI:** Next.js application that displays diagrams, KPIs, inputs, and combined insights.

## Usage

1. Provide one or more log files as input.
2. The parser analyzes logs, extracting key communication patterns.
3. Visualization is generated dynamically as Mermaid sequence diagrams.
4. KPIs and statistics update accordingly for monitoring and analysis.

## Technologies Used

- Next.js (React framework)
- Mermaid.js for diagram visualization
- JavaScript/TypeScript for parsing logic
- Node.js runtime

## Author

Developed by Myself during the Ampere internship.
