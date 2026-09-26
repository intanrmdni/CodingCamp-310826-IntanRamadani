# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side, mobile-friendly web application that allows users to record daily expenses, manage a transaction list, and visualize spending distribution by category through an interactive pie chart. All data is persisted in the browser's Local Storage. The application is built with HTML, CSS, and Vanilla JavaScript — no frameworks or backend server required.

## Glossary

- **Application**: The Expense & Budget Visualizer web application running in the user's browser.
- **Transaction**: A single expense record consisting of an item name, an amount, and a category.
- **Transaction_List**: The scrollable UI list that displays all recorded transactions.
- **Input_Form**: The HTML form containing the Item Name, Amount, and Category fields used to submit a new Transaction.
- **Category**: A classification label for a Transaction. Valid categories are: Food, Transport, and Fun.
- **Total_Balance**: The sum of all Transaction amounts currently stored, displayed at the top of the Application.
- **Pie_Chart**: A visual chart rendered via Chart.js that shows spending distribution across categories.
- **Local_Storage**: The browser's Web Storage API used to persist Transaction data client-side.
- **Validator**: The client-side logic that checks Input_Form fields before a Transaction is added.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to fill in an expense form with item name, amount, and category, so that I can record a new transaction.

#### Acceptance Criteria

1. THE Application SHALL render an Input_Form containing three fields: Item Name (text input, maximum 100 characters), Amount (number input), and Category (select).
2. THE Input_Form Category field SHALL include at minimum the options: Food, Transport, and Fun.
3. WHEN the user submits the Input_Form, THE Validator SHALL verify that the Item Name field is not empty and does not exceed 100 characters.
4. WHEN the user submits the Input_Form, THE Validator SHALL verify that the Amount field contains a numeric value between 0.01 and 999,999,999.99.
5. WHEN the user submits the Input_Form, THE Validator SHALL verify that a Category has been selected from the available options.
6. IF any Input_Form field fails validation, THEN THE Application SHALL display an inline error message adjacent to each invalid field identifying which field is missing or invalid, and SHALL NOT add a Transaction.
7. WHEN all Input_Form fields pass validation, THE Application SHALL add the Transaction and reset the Input_Form fields to their default empty state within 1 second.

---

### Requirement 2: Transaction List Management

**User Story:** As a user, I want to see all my recorded transactions in a list, so that I can review and manage my expenses.

#### Acceptance Criteria

1. THE Application SHALL render a Transaction_List that displays all stored Transactions in the order they were added, from most recently added to oldest.
2. WHEN a Transaction is added, THE Transaction_List SHALL display the Transaction's item name (up to 100 characters), amount (formatted to 2 decimal places with currency symbol), and category.
3. THE Transaction_List SHALL be scrollable when the number of Transactions exceeds the visible viewport height, with a maximum of 1000 Transactions displayed at one time.
4. WHEN a user activates the delete control for a Transaction, THE Application SHALL remove that Transaction from Local_Storage and remove that Transaction's entry from the Transaction_List within 1 second.
5. IF Local_Storage is unavailable or returns a read error when the Application loads, THEN THE Application SHALL display an error message indicating that transactions could not be retrieved and render an empty Transaction_List.
6. WHEN the Application loads, THE Application SHALL retrieve all Transactions from Local_Storage and populate the Transaction_List within 2 seconds without requiring user action.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page, so that I know how much I have spent in total.

#### Acceptance Criteria

1. THE Application SHALL display the Total_Balance at the top of the page at all times, formatted as a numeric value with exactly 2 decimal places and prefixed with a currency symbol.
2. WHEN a Transaction is added, THE Application SHALL recalculate and update the Total_Balance to reflect the new sum of all Transaction amounts within 500 milliseconds of the addition.
3. WHEN a Transaction is deleted, THE Application SHALL recalculate and update the Total_Balance to reflect the revised sum of remaining Transaction amounts within 500 milliseconds of the deletion.
4. WHEN the Application loads with existing Transactions in Local_Storage, THE Application SHALL compute and display the correct Total_Balance on initial render before the user can interact with the Transaction list.
5. IF Local_Storage contains no Transactions, THEN THE Application SHALL display a Total_Balance of 0.00.

---

### Requirement 4: Spending Distribution Pie Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand how my expenses are distributed.

#### Acceptance Criteria

1. THE Application SHALL render a Pie_Chart using Chart.js that visualizes the sum of Transaction amounts grouped by Category, where each Category is represented as a distinct slice showing its percentage of total spending.
2. WHEN a Transaction is added, THE Application SHALL update the Pie_Chart within 500ms to reflect the new spending distribution without requiring a page reload.
3. WHEN a Transaction is deleted, THE Application SHALL update the Pie_Chart within 500ms to reflect the revised spending distribution without requiring a page reload.
4. WHEN the Application loads with existing Transactions in Local_Storage, THE Application SHALL render the Pie_Chart with the correct category distribution within 1000ms of the page load event.
5. IF no Transactions exist, THEN THE Application SHALL display a placeholder state for the Pie_Chart that communicates to the user that no spending data is available.
6. IF a single Category contains 100% of total Transaction amounts, THEN THE Application SHALL render the Pie_Chart as a single full slice assigned to that Category.
7. THE Application SHALL assign a distinct color to each Category slice in the Pie_Chart such that no two adjacent slices share the same color.

---

### Requirement 5: Data Persistence via Local Storage

**User Story:** As a user, I want my transactions to be saved between sessions, so that I do not lose my data when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a Transaction is successfully added, THE Application SHALL write the updated Transaction list to Local_Storage immediately, before any user-visible confirmation is shown.
2. WHEN a Transaction is deleted, THE Application SHALL write the updated Transaction list to Local_Storage immediately, before updating the Transaction_List display.
3. WHEN the Application loads, THE Application SHALL read Transaction data from Local_Storage and restore the Transaction_List, Total_Balance, and Pie_Chart within 500 milliseconds of the page load event.
4. IF Local_Storage contains no Transaction data on load, THEN THE Application SHALL initialize the Transaction_List as empty and display a Total_Balance of zero without showing an error.
5. IF a Local_Storage read or write operation fails, THEN THE Application SHALL display an error message indicating that data could not be saved or restored, and continue operating with the in-memory Transaction_List.
6. THE Application SHALL store all Transaction data client-side only, without sending data to any external server or backend.

---

### Requirement 6: Responsive and Mobile-Friendly Layout

**User Story:** As a user, I want to use the application on my mobile device, so that I can record expenses on the go.

#### Acceptance Criteria

1. THE Application SHALL render a usable and readable layout on viewport widths from 320px to 1440px, with no horizontal scrollbar appearing at any width within that range.
2. THE Application SHALL use a single CSS file located at `css/style.css` for all visual styling.
3. THE Application SHALL include a viewport meta tag to enable proper scaling on mobile devices.
4. THE Input_Form fields and controls SHALL be large enough to interact with on a touchscreen device, with a minimum tap target size of 44x44 CSS pixels.
5. WHEN the viewport width changes, THE Pie_Chart SHALL resize proportionally so that its width does not exceed the width of its containing column and its height scales at the same ratio as its width.

---

### Requirement 7: Cross-Browser Compatibility

**User Story:** As a user, I want the application to work on any modern browser, so that I am not restricted to a specific browser.

#### Acceptance Criteria

1. THE Application SHALL function correctly in the current stable releases of Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari.
2. THE Application SHALL use only standard Web APIs (DOM, Local_Storage) supported in the browsers listed above.
3. THE Application SHALL NOT depend on any JavaScript framework or library other than Chart.js for charting.
4. IF a required standard Web API is unavailable in the browser, THEN THE Application SHALL display an error message indicating that the browser is unsupported and identify which feature is missing.

---

### Requirement 8: Project Structure and Code Quality

**User Story:** As a developer, I want the codebase to follow a clean, predictable structure, so that the code is easy to read and maintain.

#### Acceptance Criteria

1. THE Application SHALL consist of exactly three files: `index.html`, `css/style.css`, and `js/script.js`.
2. THE Application SHALL use a single JavaScript file located at `js/script.js` containing all application logic.
3. THE Application SHALL load Chart.js from a CDN without requiring a build tool or package manager.
4. THE Application SHALL NOT use React, Vue, Angular, or any other JavaScript UI framework or runtime.
5. THE `js/script.js` file SHALL organize code into named functions, each with a single, clearly named responsibility.
