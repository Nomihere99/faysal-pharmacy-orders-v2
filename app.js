/* Faysal Pharmacy — Demand & Order Management */

"use strict";

const STORAGE_KEY = "faysalOrdersV2";

let database = {
    demands: [],
    orders: []
};

let selectedDemands = new Set();
let currentOrderItems = [];
let currentDemandFilter = "all";


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


function loadDatabase() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            if (parsed && typeof parsed === "object") {
                database = {
                    demands: Array.isArray(parsed.demands)
                        ? parsed.demands
                        : [],

                    orders: Array.isArray(parsed.orders)
                        ? parsed.orders
                        : []
                };
            }
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


function makeId(prefix) {
    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2, 8)
    );
}


function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString();
}


/* =========================
   DASHBOARD
========================= */

function updateDashboard() {

    const pending =
        database.demands.filter(function (item) {
            return item.status === "pending";
        }).length;

    const ordered =
        database.demands.filter(function (item) {
            return item.status === "ordered";
        }).length;

    const received =
        database.demands.filter(function (item) {
            return item.status === "received";
        }).length;


    const pendingCount =
        $("pendingCount");

    const orderedCount =
        $("orderedCount");

    const receivedCount =
        $("receivedCount");


    if (pendingCount) {
        pendingCount.textContent = pending;
    }

    if (orderedCount) {
        orderedCount.textContent = ordered;
    }

    if (receivedCount) {
        receivedCount.textContent = received;
    }


    const pendingAlt =
        $("summaryPending");

    const orderedAlt =
        $("summaryOrdered");

    const receivedAlt =
        $("summaryReceived");


    if (pendingAlt) {
        pendingAlt.textContent = pending;
    }

    if (orderedAlt) {
        orderedAlt.textContent = ordered;
    }

    if (receivedAlt) {
        receivedAlt.textContent = received;
    }
}


/* =========================
   RECENT ACTIVITY
========================= */

function renderRecentActivity() {

    const list =
        $("recentActivity");

    if (!list) return;


    const recent =
        database.demands.slice(0, 5);


    if (recent.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No demands yet</h3>
                <p>Your recent demands will appear here.</p>
            </div>
        `;

        return;
    }


    list.innerHTML =
        recent.map(function (item) {

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
                            Quantity:
                            ${Number(item.quantity) || 1}
                        </span>

                        <small>
                            ${escapeHTML(
                                formatDate(item.createdAt)
                            )}
                        </small>

                    </div>

                    <div class="activity-status">
                        ${escapeHTML(
                            capitalize(
                                item.status || "pending"
                            )
                        )}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================
   DEMANDS
========================= */

function renderDemands() {

    const list =
        $("demandsList");

    if (!list) return;


    const searchInput =
        $("demandSearch");


    const searchTerm =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";


    const items =
        database.demands.filter(function (item) {

            const matchesStatus =
                currentDemandFilter === "all" ||
                item.status === currentDemandFilter;


            const searchable =
                String(item.medicine || "").toLowerCase() +
                " " +
                String(item.note || "").toLowerCase();


            const matchesSearch =
                !searchTerm ||
                searchable.includes(searchTerm);


            return (
                matchesStatus &&
                matchesSearch
            );
        });


    if (items.length === 0) {

        list.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    No demands
                </h3>

                <p>
                    Medicine demands will appear here.
                </p>

            </div>
        `;

        return;
    }


    list.innerHTML =
        items.map(function (item) {

            const checked =
                selectedDemands.has(item.id)
                    ? "checked"
                    : "";


            return `
                <div
                    class="activity-card demand-card"
                    data-demand-id="${escapeHTML(item.id)}"
                >

                    <div class="activity-icon">
                        📦
                    </div>


                    <div class="activity-info">

                        <strong>
                            ${escapeHTML(item.medicine)}
                        </strong>

                        <span>
                            Quantity:
                            ${Number(item.quantity) || 1}
                        </span>

                        ${
                            item.note
                                ? `<span>
                                    ${escapeHTML(item.note)}
                                   </span>`
                                : ""
                        }

                        <small>
                            ${escapeHTML(
                                formatDate(item.createdAt)
                            )}
                        </small>

                    </div>


                    <div class="activity-status">

                        ${escapeHTML(
                            capitalize(
                                item.status || "pending"
                            )
                        )}

                    </div>


                    ${
                        item.status === "pending"
                            ? `
                                <label class="demand-select">

                                    <input
                                        type="checkbox"
                                        class="demand-checkbox"
                                        data-id="${escapeHTML(item.id)}"
                                        ${checked}
                                    >

                                </label>
                              `
                            : ""
                    }

                </div>
            `;

        }).join("");


    list
        .querySelectorAll(".demand-checkbox")
        .forEach(function (checkbox) {

            checkbox.addEventListener(
                "change",
                function () {

                    const id =
                        this.dataset.id;


                    if (this.checked) {

                        selectedDemands.add(id);

                    } else {

                        selectedDemands.delete(id);

                    }

                }
            );

        });
}


/* =========================
   ADD DEMAND
========================= */

function addDemandFromForm(event) {

    event.preventDefault();


    const medicineInput =
        $("medicineName");

    const quantityInput =
        $("demandQuantity");

    const noteInput =
        $("demandNote");


    if (!medicineInput) {

        console.error(
            "medicineName input not found."
        );

        return;
    }


    const medicine =
        medicineInput.value.trim();


    if (!medicine) {

        alert(
            "Please enter medicine name."
        );

        medicineInput.focus();

        return;
    }


    let quantity =
        parseInt(
            quantityInput
                ? quantityInput.value
                : "1",
            10
        );


    if (
        !Number.isFinite(quantity) ||
        quantity < 1
    ) {

        quantity = 1;

    }


    const note =
        noteInput
            ? noteInput.value.trim()
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
