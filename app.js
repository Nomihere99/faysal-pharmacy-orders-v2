"use strict";

/* =========================================================
   FAYSAL PHARMACY
   DEMAND & ORDER MANAGEMENT
   COMPLETE CLEAN VERSION
   ========================================================= */

const STORAGE_KEY = "faysalOrdersV2";


/* =========================================================
   DATABASE
   ========================================================= */

let database = {
    demands: [],
    orders: []
};

let selectedDemands = new Set();


/* =========================================================
   BASIC HELPERS
   ========================================================= */

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

    return String(value ?? "").replace(
        /[&<>"']/g,
        function (character) {
            return map[character];
        }
    );
}


function makeId(prefix) {

    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}


function formatDate(date) {

    if (!date) return "";

    try {

        return new Date(date).toLocaleString();

    } catch (error) {

        return "";

    }
}


function capitalize(value) {

    if (!value) return "";

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}


/* =========================================================
   DATABASE LOAD
   ========================================================= */

function loadDatabase() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) {

            database = {
                demands: [],
                orders: []
            };

            return;
        }

        const parsed =
            JSON.parse(saved);

        database = {

            demands:
                Array.isArray(parsed.demands)
                    ? parsed.demands
                    : [],

            orders:
                Array.isArray(parsed.orders)
                    ? parsed.orders
                    : []

        };

    } catch (error) {

        console.error(
            "Could not load saved data:",
            error
        );

        database = {
            demands: [],
            orders: []
        };

    }
}


/* =========================================================
   DATABASE SAVE
   ========================================================= */

function saveDatabase() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(database)
        );

    } catch (error) {

        console.error(
            "Could not save data:",
            error
        );

        alert(
            "Unable to save data on this device."
        );

    }
}


/* =========================================================
   DEMAND MODAL
   ========================================================= */

function openDemandModal() {

    const modal = $("demandModal");

    if (!modal) return;

    modal.classList.add("active");

    document.body.style.overflow = "hidden";

    setTimeout(function () {

        const employee = $("employee");

        if (employee) {
            employee.focus();
        }

    }, 100);
}


function closeDemandModal() {

    const modal = $("demandModal");

    if (!modal) return;

    modal.classList.remove("active");

    document.body.style.overflow = "";
}


/* =========================================================
   SAVE DEMAND
   ========================================================= */

function saveDemand(event) {

    if (event) {
        event.preventDefault();
    }

    const employeeInput =
        $("employee");

    const medicineInput =
        $("medicine");

    const quantityInput =
        $("quantity");

    const noteInput =
        $("note");


    if (
        !employeeInput ||
        !medicineInput ||
        !quantityInput
    ) {

        alert(
            "Form fields could not be found."
        );

        return;
    }


    const employee =
        employeeInput.value.trim();

    const medicine =
        medicineInput.value.trim();


    let quantity =
        parseInt(
            quantityInput.value,
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


    if (!employee) {

        alert(
            "Please enter employee name."
        );

        employeeInput.focus();

        return;
    }


    if (!medicine) {

        alert(
            "Please enter medicine / product name."
        );

        medicineInput.focus();

        return;
    }


    const demand = {

        id: makeId("demand"),

        employee: employee,

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


    const form =
        $("demandForm");

    if (form) {
        form.reset();
    }


    quantityInput.value = 1;


    closeDemandModal();


    updateDashboard();

    renderHome();

    renderDemands();

    renderOrders();


    alert(
        "Demand saved successfully."
    );
}


/* =========================================================
   QUANTITY CONTROLS
   ========================================================= */

function increaseQuantity() {

    const input =
        $("quantity");

    if (!input) return;

    let value =
        parseInt(
            input.value,
            10
        ) || 1;

    input.value =
        value + 1;
}


function decreaseQuantity() {

    const input =
        $("quantity");

    if (!input) return;

    let value =
        parseInt(
            input.value,
            10
        ) || 1;

    if (value > 1) {
        value--;
    }

    input.value = value;
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

    const pending =
        database.demands.filter(
            function (item) {
                return item.status === "pending";
            }
        ).length;


    const ordered =
        database.demands.filter(
            function (item) {
                return item.status === "ordered";
            }
        ).length;


    const received =
        database.demands.filter(
            function (item) {
                return item.status === "received";
            }
        ).length;


    const pendingStat =
        $("pendingStat");

    const orderedStat =
        $("orderedStat");

    const receivedStat =
        $("receivedStat");


    if (pendingStat) {
        pendingStat.textContent =
            pending;
    }


    if (orderedStat) {
        orderedStat.textContent =
            ordered;
    }


    if (receivedStat) {
        receivedStat.textContent =
            received;
    }


    updateSelectedCount();
}


/* =========================================================
   HOME
   ========================================================= */

function renderHome() {

    const list =
        $("homeList");

    if (!list) return;


    const recent =
        database.demands.slice(0, 5);


    if (recent.length === 0) {

        list.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    No demands yet
                </h3>

                <p>
                    Your recent demands will appear here.
                </p>

            </div>

        `;

        return;
    }


    list.innerHTML =
        recent.map(
            function (item) {

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
                                ${escapeHTML(item.employee)}
                            </span>

                            <span>
                                Quantity: ${item.quantity}
                            </span>

                            <small>
                                ${formatDate(item.createdAt)}
                            </small>

                        </div>

                        <div class="activity-status">
                            ${escapeHTML(
                                capitalize(item.status)
                            )}
                        </div>

                    </div>

                `;

            }
        ).join("");
}


/* =========================================================
   DEMANDS
   ========================================================= */

function renderDemands() {

    const list =
        $("demandList");

    if (!list) return;


    const pendingDemands =
        database.demands.filter(
            function (item) {

                return item.status === "pending";

            }
        );


    if (pendingDemands.length === 0) {

        list.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    No pending demands
                </h3>

                <p>
                    New medicine demands will appear here.
                </p>

            </div>

        `;

        updateSelectedCount();

        return;
    }


    list.innerHTML =
        pendingDemands.map(
            function (item) {

                const checked =
                    selectedDemands.has(
                        item.id
                    )
                        ? "checked"
                        : "";


                return `

                    <label class="activity-card demand-select-card">

                        <div class="activity-icon">

                            <input
                                type="checkbox"
                                class="demand-checkbox"
                                data-id="${escapeHTML(item.id)}"
                                ${checked}
                            >

                        </div>


                        <div class="activity-info">

                            <strong>
                                ${escapeHTML(item.medicine)}
                            </strong>

                            <span>
                                Employee:
                                ${escapeHTML(item.employee)}
                            </span>

                            <span>
                                Quantity:
                                ${item.quantity}
                            </span>

                            ${
                                item.note
                                    ? `
                                        <span>
                                            ${escapeHTML(item.note)}
                                        </span>
                                      `
                                    : ""
                            }

                            <small>
                                ${formatDate(item.createdAt)}
                            </small>

                        </div>


                        <div class="activity-status">
                            Pending
                        </div>

                    </label>

                `;

            }
        ).join("");


    document
        .querySelectorAll(
            ".demand-checkbox"
        )
        .forEach(
            function (checkbox) {

                checkbox.addEventListener(
                    "change",
                    function () {

                        const id =
                            this.dataset.id;


                        if (this.checked) {

                            selectedDemands.add(
                                id
                            );

                        } else {

                            selectedDemands.delete(
                                id
                            );

                        }


                        updateSelectedCount();

                    }
                );

            }
        );


    updateSelectedCount();
}


/* =========================================================
   SELECTED COUNT
   ========================================================= */

function updateSelectedCount() {

    const count =
        $("selectedCount");

    if (!count) return;

    count.textContent =
        selectedDemands.size;
}


/* =========================================================
   OPEN ORDER MODAL
   ========================================================= */

function openOrderModal() {

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
            "Please select at least one pending demand."
        );

        return;
    }


    const modal =
        $("orderModal");

    if (!modal) {

        alert(
            "Order window could not be found."
        );

        return;
    }


    const preview =
        $("orderPreview");


    if (preview) {

        preview.innerHTML =
            selected.map(
                function (item) {

                    return `

                        <div class="preview-item">

                            <strong>
                                ${escapeHTML(item.medicine)}
                            </strong>

                            <span>
                                Qty:
                                ${item.quantity}
                            </span>

                        </div>

                    `;

                }
            ).join("");

    }


    const distributor =
        $("distributor");


    if (distributor) {
        distributor.value = "";
    }


    modal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   CLOSE ORDER MODAL
   ========================================================= */

function closeOrderModal() {

    const modal =
        $("orderModal");

    if (!modal) return;


    modal.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";
}


/* =========================================================
   SAVE ORDER
   ========================================================= */

function saveOrder() {

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
            "Please select at least one demand."
        );

        return;
    }


    const distributorInput =
        $("distributor");


    const distributor =
        distributorInput
            ? distributorInput.value.trim()
            : "";


    if (!distributor) {

        alert(
            "Please enter distributor name."
        );


        if (distributorInput) {
            distributorInput.focus();
        }


        return;
    }


    const order = {

        id: makeId("order"),

        distributor: distributor,

        status: "ordered",

        items:
            selected.map(
                function (item) {

                    return {

                        demandId:
                            item.id,

                        medicine:
                            item.medicine,

                        quantity:
                            item.quantity,

                        employee:
                            item.employee

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


    saveDatabase();


    closeOrderModal();


    updateDashboard();

    renderHome();

    renderDemands();

    renderOrders();


    alert(
        "Order saved successfully."
    );
}


/* =========================================================
   WHATSAPP
   ========================================================= */

function sendOrderWhatsApp() {

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
            "Please select at least one demand."
        );

        return;
    }


    const distributorInput =
        $("distributor");


    const distributor =
        distributorInput
            ? distributorInput.value.trim()
            : "";


    let message =
        "Faysal Pharmacy - Order\n\n";


    if (distributor) {

        message +=
            "Distributor: " +
            distributor +
            "\n\n";

    }


    selected.forEach(
        function (item, index) {

            message +=
                (index + 1) +
                ". " +
                item.medicine +
                " - Qty: " +
                item.quantity +
                "\n";

        }
    );


    message +=
        "\nThank you.";


    const url =
        "https://wa.me/?text=" +
        encodeURIComponent(message);


    window.open(
        url,
        "_blank"
    );
}


/* =========================================================
   ORDERS
   ========================================================= */

function renderOrders() {

    const list =
        $("orderList");

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
                    Your distributor orders will appear here.
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


                const receivedButton =
                    order.status !== "received"

                        ? `

                            <button
                                class="receive-btn"
                                data-order-id="${escapeHTML(order.id)}"
                                type="button">

                                Mark Received

                            </button>

                          `

                        : "";


                return `

                    <div class="activity-card order-card">

                        <div class="activictedCount");

    if (!count) return;

    count.textContent = selectedDemands.size;
}

/* =========================================================
   CREATE ORDER
   ========================================================= */

function openOrderModal() {

    const selected = database.demands.filter(function (item) {
        return (
            selectedDemands.has(item.id) &&
            item.status === "pending"
        );
    });

    if (selected.length === 0) {
        alert("Please select at least one pending demand.");
        return;
    }

    const modal = $("orderModal");

    if (!modal) return;

    const preview = $("orderPreview");

    if (preview) {

        preview.innerHTML = selected.map(function (item) {

            return `
                <div class="preview-item">

                    <strong>
                        ${escapeHTML(item.medicine)}
                    </strong>

                    <span>
                        Qty: ${item.quantity}
                    </span>

                </div>
            `;

        }).join("");
    }

    const distributor = $("distributor");

    if (distributor) {
        distributor.value = "";
    }

    modal.classList.add("active");

    document.body.style.overflow = "hidden";
}

function closeOrderModal() {

    const modal = $("orderModal");

    if (!modal) return;

    modal.classList.remove("active");

    document.body.style.overflow = "";
}

/* =========================================================
   SAVE ORDER
   ========================================================= */

function saveOrder() {

    const selected = database.demands.filter(function (item) {

        return (
            selectedDemands.has(item.id) &&
            item.status === "pending"
        );

    });

    if (selected.length === 0) {
        alert("Please select at least one demand.");
        return;
    }

    const distributorInput = $("distributor");

    const distributor = distributorInput
        ? distributorInput.value.trim()
        : "";

    if (!distributor) {
        alert("Please enter distributor name.");
        if (distributorInput) distributorInput.focus();
        return;
    }

    const order = {

        id: makeId("order"),

        distributor: distributor,

        status: "ordered",

        items: selected.map(function (item) {

            return {
                demandId: item.id,
                medicine: item.medicine,
                quantity: item.quantity,
                employee: item.employee
            };

        }),

        createdAt: new Date().toISOString()

    };

    database.orders.unshift(order);

    selected.forEach(function (item) {
        item.status = "ordered";
    });

    selectedDemands.clear();

    saveDatabase();

    closeOrderModal();

    updateDashboard();
    renderHome();
    renderDemands();
    renderOrders();

    alert("Order saved successfully.");
}

/* =========================================================
   WHATSAPP
   ========================================================= */

function sendOrderWhatsApp() {

    const selected = database.demands.filter(function (item) {

        return (
            selectedDemands.has(item.id) &&
            item.status === "pending"
        );

    });

    if (selected.length === 0) {
        alert("Please select at least one demand.");
        return;
    }

    const distributorInput = $("distributor");

    const distributor = distributorInput
        ? distributorInput.value.trim()
        : "";

    let message = "Faysal Pharmacy - Order\n\n";

    if (distributor) {
        message += "Distributor: " + distributor + "\n\n";
    }

    selected.forEach(function (item, index) {

        message +=
            (index + 1) +
            ". " +
            item.medicine +
            " - Qty: " +
            item.quantity +
            "\n";

    });

    message += "\nThank you.";

    const url =
        "https://wa.me/?text=" +
        encodeURIComponent(message);

    window.open(url, "_blank");
}

/* =========================================================
   ORDERS
   ========================================================= */

function renderOrders() {

    const list = $("orderList");

    if (!list) return;

    if (database.orders.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h3>No orders yet</h3>
                <p>Your distributor orders will appear here.</p>
            </div>
        `;

        return;
    }

    list.innerHTML = database.orders.map(function (order) {

        const items = Array.isArray(order.items)
            ? order.items
            : [];

        const receivedButton =
            order.status !== "received"
                ? `
                    <button
                        class="receive-btn"
                        data-order-id="${escapeHTML(order.id)}"
                        type="button">
                        Mark Received
                    </button>
                `
                : "";

        return `
            <div class="activity-card order-card">

                <div class="activity-icon">
                    🛒
                </div>

                <div class="activity-info">

                    <strong>
                        ${escapeHTML(order.distributor)}
                    </strong>

                    <span>
                        ${items.length}
                        item${items.length === 1 ? "" : "s"}
                    </span>

                    <small>
                        ${formatDate(order.createdAt)}
                    </small>

                    ${receivedButton}

                </div>

                <div class="activity-status">
                    ${escapeHTML(capitalize(order.status))}
                </div>

            </div>
        `;

    }).join("");

    document.querySelectorAll(".receive-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            const orderId = this.dataset.orderId;

            markOrderReceived(orderId);

        });

    });
}

/* =========================================================
   MARK ORDER RECEIVED
   ========================================================= */

function markOrderReceived(orderId) {

    const order = database.orders.find(function (item) {
        return item.id === orderId;
    });

    if (!order) return;

    order.status = "received";

    const demandIds = Array.isArray(order.items)
        ? order.items.map(function (item) {
            return item.demandId;
        })
        : [];

    database.demands.forEach(function (demand) {

        if (demandIds.includes(demand.id)) {
            demand.status = "received";
        }

    });

    saveDatabase();

    updateDashboard();
    renderHome();
    renderDemands();
    renderOrders();

    alert("Order marked as received.");
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const navButtons =
        document.querySelectorAll(".nav[data-page]");

    navButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const page =
                button.getAttribute("data-page");

            document.querySelectorAll(".nav[data-page]")
                .forEach(function (item) {
                    item.classList.remove("active");
                });

            document.querySelectorAll(".page")
                .forEach(function (screen) {
                    screen.classList.remove("active");
                });

            button.classList.add("active");

            const target = $(page);

            if (target) {
                target.classList.add("active");
            }

            if (page === "demands") {
                renderDemands();
            }

            if (page === "orders") {
                renderOrders();
            }

        });

    });
}

/* =========================================================
   CLEAR DATA
   ========================================================= */

function clearAllData() {

    const confirmed = confirm(
        "This will delete all demands and orders saved on this device. Continue?"
    );

    if (!confirmed) return;

    database = {
        demands: [],
        orders: []
    };

    selectedDemands.clear();

    saveDatabase();

    updateDashboard();
    renderHome();
    renderDemands();
    renderOrders();

    alert("All local data has been cleared.");
}

/* =========================================================
   CAPITALIZE
   ========================================================= */

function capitalize(value) {

    if (!value) return "";

    return value.charAt(0).toUpperCase() +
        value.slice(1);
}

/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("Faysal Pharmacy app starting...");

    loadDatabase();

    /* Add Demand */
    const addDemandBtn = $("addDemandBtn");

    if (addDemandBtn) {
        addDemandBtn.addEventListener(
            "click",
            openDemandModal
        );
    }

    /* Close Demand Modal */
    const closeModal = $("closeModal");

    if (closeModal) {
        closeModal.addEventListener(
            "click",
            closeDemandModal
        );
    }

    /* Demand Modal Backdrop */
    const demandBackdrop =
        document.querySelector("#demandModal .backdrop");

    if (demandBackdrop) {
        demandBackdrop.addEventListener(
            "click",
            closeDemandModal
        );
    }

    /* Demand Form */
    const demandForm = $("demandForm");

    if (demandForm) {
        demandFemandModal() {

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
