"use strict";

const STORAGE_KEY = "faysalOrdersV2";

let database = {
    demands: [],
    orders: []
};

let currentOrderItems = [];
let selectedDemands = new Set();


// =========================
// BASIC HELPERS
// =========================

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    };

    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        return map[character];
    });
}


// =========================
// LOAD / SAVE DATABASE
// =========================

function loadDatabase() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            database = {
                demands: Array.isArray(parsed.demands)
                    ? parsed.demands
                    : [],

                orders: Array.isArray(parsed.orders)
                    ? parsed.orders
                    : []
            };
        }
    } catch (error) {
        console.error("Could not load saved data:", error);

        database = {
            demands: [],
            orders: []
        };
    }
}

function saveDatabase() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(database)
        );
    } catch (error) {
        console.error("Could not save data:", error);

        alert("Unable to save data on this device.");
    }
}


// =========================
// ADD DEMAND MODAL
// =========================

function openDemandModal() {

    const modal = $("demandModal");

    if (!modal) {
        console.error("demandModal not found");
        return;
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeDemandModal() {

    const modal = $("demandModal");

    if (!modal) return;

    modal.classList.remove("active");
    document.body.style.overflow = "";
}


// =========================
// SAVE DEMAND
// =========================

function saveDemand(event) {

    event.preventDefault();

    const employeeInput = $("employee");
    const medicineInput = $("medicine");
    const quantityInput = $("quantity");
    const noteInput = $("note");

    if (!employeeInput || !medicineInput || !quantityInput) {
        alert("Form fields could not be found.");
        return;
    }

    const employee = employeeInput.value.trim();
    const medicine = medicineInput.value.trim();

    let quantity = parseInt(quantityInput.value, 10);

    if (!quantity || quantity < 1) {
        quantity = 1;
    }

    const note = noteInput
        ? noteInput.value.trim()
        : "";

    if (!employee) {
        alert("Please enter employee name.");
        employeeInput.focus();
        return;
    }

    if (!medicine) {
        alert("Please enter medicine / product name.");
        medicineInput.focus();
        return;
    }

    const demand = {
        id: Date.now(),
        employee: employee,
        medicine: medicine,
        quantity: quantity,
        note: note,
        status: "pending",
        createdAt: new Date().toISOString()
    };

    database.demands.unshift(demand);

    saveDatabase();

    $("demandForm").reset();

    quantityInput.value = 1;

    closeDemandModal();

    updateDashboard();
    renderDemands();

    alert("Demand saved successfully.");
}


// =========================
// QUANTITY CONTROLS
// =========================

function increaseQuantity() {

    const input = $("quantity");

    if (!input) return;

    let value = parseInt(input.value, 10) || 1;

    input.value = value + 1;
}

function decreaseQuantity() {

    const input = $("quantity");

    if (!input) return;

    let value = parseInt(input.value, 10) || 1;

    if (value > 1) {
        value--;
    }

    input.value = value;
}


// =========================
// DASHBOARD
// =========================

function updateDashboard() {

    const pending = database.demands.filter(
        item => item.status === "pending"
    ).length;

    const ordered = database.demands.filter(
        item => item.status === "ordered"
    ).length;

    const received = database.demands.filter(
        item => item.status === "received"
    ).length;


    const pendingCount = $("pendingCount");
    const orderedCount = $("orderedCount");
    const receivedCount = $("receivedCount");


    if (pendingCount) {
        pendingCount.textContent = pending;
    }

    if (orderedCount) {
        orderedCount.textContent = ordered;
    }

    if (receivedCount) {
        receivedCount.textContent = received;
    }
}


// =========================
// DEMANDS LIST
// =========================

function renderDemands() {

    const list = $("demandsList");

    if (!list) return;

    if (database.demands.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No demands</h3>
                <p>Medicine demands will appear here.</p>
            </div>
        `;

        return;
    }


    list.innerHTML = database.demands.map(function (item) {

        let statusText = "Pending";

        if (item.status === "ordered") {
            statusText = "Ordered";
        }

        if (item.status === "received") {
            statusText = "Received";
        }


        return `
            <div class="activity-card">

                <div class="activity-icon">
                    📦
                </div>

                <div class="activity-info">

                    <strong>
                        ${escapeHTML(item.medicine)}
                    </strong>

                    <span>
                        Employee: ${escapeHTML(item.employee)}
                    </span>

                    <span>
                        Quantity: ${item.quantity}
                    </span>

                    ${
                        item.note
                        ? `<span>${escapeHTML(item.note)}</span>`
                        : ""
                    }

                    <small>
                        ${new Date(item.createdAt).toLocaleString()}
                    </small>

                </div>

                <div class="activity-status">
                    ${statusText}
                </div>

            </div>
        `;

    }).join("");
}


// =========================
// NAVIGATION
// =========================

function setupNavigation() {

    const navButtons =
        document.querySelectorAll(".nav[data-page]");

    navButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const page =
                button.getAttribute("data-page");

            document.querySelectorAll("[data-page]").forEach(function (item) {
                item.classList.remove("active");
            });

            button.classList.add("active");

            document.querySelectorAll(".page, .screen").forEach(function (screen) {
                screen.classList.remove("active");
            });

            const target =
                $(page);

            if (target) {
                target.classList.add("active");
            }
        });
    });
}


// =========================
// START APPLICATION
// =========================

document.addEventListener("DOMContentLoaded", function () {

    console.log("Faysal Pharmacy app starting...");

    loadDatabase();


    // ADD DEMAND BUTTON
    const addDemandBtn = $("addDemandBtn");

    if (addDemandBtn) {
        addDemandBtn.addEventListener(
            "click",
            openDemandModal
        );
    }


    // CLOSE MODAL
    const closeButton = $("closeModal");

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeDemandModal
        );
    }


    // BACKDROP CLOSE
    const backdrop =
        document.querySelector("#demandModal .backdrop");

    if (backdrop) {
        backdrop.addEventListener(
            "click",
            closeDemandModal
        );
    }


    // DEMAND FORM
    const form = $("demandForm");

    if (form) {
        form.addEventListener(
            "submit",
            saveDemand
        );
    }


    // PLUS
    const plus = $("plus");

    if (plus) {
        plus.addEventListener(
            "click",
            increaseQuantity
        );
    }


    // MINUS
    const minus = $("minus");

    if (minus) {
        minus.addEventListener(
            "click",
            decreaseQuantity
        );
    }


    setupNavigation();

    updateDashboard();
    renderDemands();

    console.log("Faysal Pharmacy app ready.");
});rim()
            : "";


    const demand = {

        id: makeId("demand"),

        medicine: medicine,

        quantity: quantity,

        note: note,

        status: "pending",

        createdAt:
            new Date().toISOString()

    };


    database.demands.unshift(
        demand
    );


    saveDatabase();


    closeDemandModal();


    if ($("demandForm")) {

        $("demandForm").reset();

    }


    if (quantityInput) {

        quantityInput.value = "1";

    }


    updateAllViews();


    alert(
        "Demand added successfully."
    );
}


/* =========================
   DEMAND MODAL
========================= */

function openDemandModal() {

    const modal =
        $("demandModal");


    if (!modal) {

        console.warn(
            "demandModal not found."
        );

        return;
    }


    modal.classList.add("active");

    modal.classList.add("show");

    document.body.style.overflow =
        "hidden";


    const medicineInput =
        $("medicineName");


    if (medicineInput) {

        setTimeout(
            function () {

                medicineInput.focus();

            },
            100
        );

    }
}


function closeDemandModal() {

    const modal =
        $("demandModal");


    if (!modal) return;


    modal.classList.remove(
        "active"
    );

    modal.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";
}


/* =========================
   QUANTITY
========================= */

function changeQuantity(amount) {

    const input =
        $("demandQuantity");


    if (!input) return;


    let value =
        parseInt(
            input.value,
            10
        );


    if (
        !Number.isFinite(value) ||
        value < 1
    ) {

        value = 1;

    }


    value += amount;


    if (value < 1) {

        value = 1;

    }


    input.value =
        value;
}


/* =========================
   ORDERS
========================= */

function renderOrders() {

    const list =
        $("ordersList");


    if (!list) return;


    if (database.orders.length === 0) {

        list.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🛒
                </div>

                <h3>
                    No orders yet
                </h3>

                <p>
                    Your distributor orders
                    will appear here.
                </p>

            </div>
        `;

        return;
    }


    list.innerHTML =
        database.orders.map(
            function (order) {

                const items =
                    Array.isArray(order.items)
                        ? order.items
                        : [];


                return `
                    <div class="activity-card order-card">

                        <div class="activity-icon">
                            🛒
                        </div>


                        <div class="activity-info">

                            <strong>
                                ${escapeHTML(
                                    order.distributor ||
                                    "Distributor order"
                                )}
                            </strong>

                            <span>
                                ${items.length}
                                item${
                                    items.length === 1
                                        ? ""
                                        : "s"
                                }
                            </span>

                            <small>
                                ${escapeHTML(
                                    formatDate(
                                        order.createdAt
                                    )
                                )}
                            </small>

                        </div>


                        <div class="activity-status">

                            ${escapeHTML(
                                capitalize(
                                    order.status ||
                                    "pending"
                                )
                            )}

                        </div>

                    </div>
                `;

            }
        ).join("");
}


function createOrderFromSelectedDemands() {

    const selected =
        database.demands.filter(
            function (item) {

                return (
                    selectedDemands.has(item.id) &&
                    item.status === "pending"
                );

            }
        );


    if (selected.length === 0) {

        alert(
            "Select at least one pending demand first."
        );

        return;
    }


    const distributor =
        prompt(
            "Enter distributor name:"
        );


    if (distributor === null) {

        return;

    }


    const name =
        distributor.trim() ||
        "Distributor";


    const order = {

        id: makeId("order"),

        distributor: name,

        status: "ordered",

        items:
            selected.map(
                function (item) {

                    return {

                        demandId: item.id,

                        medicine: item.medicine,

                        quantity: item.quantity

                    };

                }
            ),

        createdAt:
            new Date().toISOString()

    };


    database.orders.unshift(
        order
    );


    selected.forEach(
        function (item) {

            item.status =
                "ordered";

        }
    );


    selectedDemands.clear();


    currentOrderItems =
        order.items.slice();


    saveDatabase();


    updateAllViews();


    alert(
        "Order created successfully."
    );
}


/* =========================
   NAVIGATION
========================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    const screens =
        document.querySelectorAll(
            ".screen"
        );


    navItems.forEach(
        function (nav) {

            nav.addEventListener(
                "click",
                function () {

                    const target =
                        nav.dataset.screen;


                    if (!target) return;


                    navItems.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    screens.forEach(
                        function (screen) {

                            screen.classList.remove(
                                "active"
                            );

                        }
                    );


                    nav.classList.add(
                        "active"
                    );


                    const targetScreen =
                        $(target);


                    if (targetScreen) {

                        targetScreen.classList.add(
                            "active"
                        );

                    }

                }
            );

        }
    );
}


/* =========================
   SEARCH & FILTERS
========================= */

function setupDemandFilters() {

    const search =
        $("demandSearch");


    if (search) {

        search.addEventListener(
            "input",
            renderDemands
        );

    }


    const possibleButtons =
        document.querySelectorAll(
            "[data-filter], .filter-btn, .demand-filter"
        );


    possibleButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const filter =
                        this.dataset.filter ||
                        this.dataset.status ||
                        this.getAttribute(
                            "data-value"
                        );


                    if (!filter) return;


                    currentDemandFilter =
                        filter.toLowerCase();


                    possibleButtons.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    this.classList.add(
                        "active"
                    );


                    renderDemands();

                }
            );

        }
    );
}


/* =========================
   BUTTON SETUP
========================= */

function setupButtons() {

    const addDemandBtn =
        $("addDemandBtn");


    if (addDemandBtn) {

        addDemandBtn.addEventListener(
            "click",
            openDemandModal
        );

    }


    const closeButton =
        $("closeDemandModal");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeDemandModal
        );

    }


    const overlay =
        document.querySelector(
            ".modal-overlay"
        );


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeDemandModal
        );

    }


    const form =
        $("demandForm");


    if (form) {

        form.addEventListener(
            "submit",
            addDemandFromForm
        );

    }


    const increaseButton =
        $("increaseQuantity");


    if (increaseButton) {

        increaseButton.addEventListener(
            "click",
            function () {

                changeQuantity(1);

            }
        );

    }


    const decreaseButton =
        $("decreaseQuantity");


    if (decreaseButton) {

        decreaseButton.addEventListener(
        rm("Clear all local demo data?")) {
        return;
    }

    database = {
        demands: [],
        orders: []
    };

    selectedDemands.clear();
    currentOrderItems = [];

    save();
    render();
}

document.addEventListener("DOMContentLoaded", function () {

    $("addDemandBtn").addEventListener(
        "click",
        openDemandModal
    );

    $("closeModal").addEventListener(
        "click",
        closeDemandModal
    );

    $("demandModal")
        .querySelector(".backdrop")
        .addEventListener(
            "click",
            closeDemandModal
        );

    $("plus").addEventListener("click", function () {
        $("quantity").value =
            Number($("quantity").value || 1) + 1;
    });

    $("minus").addEventListener("click", function () {
        $("quantity").value =
            Math.max(
                1,
                Number($("quantity").value || 1) - 1
            );
    });

    $("demandForm").addEventListener(
        "submit",
        saveDemand
    );

    $("makeOrderBtn").addEventListener(
        "click",
        openOrderModal
    );

    $("closeOrder").addEventListener(
        "click",
        closeOrderModal
    );

    $("orderModal")
        .querySelector(".backdrop")
        .addEventListener(
            "click",
            closeOrderModal
        );

    $("distributor").addEventListener(
        "input",
        updateOrderPreview
    );

    $("whatsappBtn").addEventListener(
        "click",
        sendWhatsApp
    );

    $("saveOrderBtn").addEventListener(
        "click",
        saveOrder
    );

    $("clearDataBtn").addEventListener(
        "click",
        clearData
    );

    document.querySelectorAll(".nav")
        .forEach(nav => {
            nav.addEventListener(
                "click",
                function () {
                    showPage(
                        this.dataset.page
                    );
                }
            );
        });

    render();
});
