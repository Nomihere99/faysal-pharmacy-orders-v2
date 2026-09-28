const STORAGE_KEY = "faysalOrdersV2";

let database;
let selectedDemands = new Set();
let currentOrderItems = [];

try {
    database = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ||
        '{"demands":[],"orders":[]}'
    );
} catch (error) {
    database = { demands: [], orders: [] };
}

function $(id) {
    return document.getElementById(id);
}

function save() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(database)
    );
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };
        return map[character];
    });
}

function badge(status) {
    return '<span class="badge ' + status + '">' +
        status.charAt(0).toUpperCase() + status.slice(1) +
        '</span>';
}

function empty(text) {
    return '<div class="info-card"><p>' +
        text +
        '</p></div>';
}

function render() {
    const pending = database.demands.filter(
        item => item.status === "pending"
    ).length;

    const ordered = database.demands.filter(
        item => item.status === "ordered"
    ).length;

    const received = database.demands.filter(
        item => item.status === "received"
    ).length;

    $("pendingStat").textContent = pending;
    $("orderedStat").textContent = ordered;
    $("receivedStat").textContent = received;

    renderHome();
    renderDemands();
    renderOrders();

    $("selectedCount").textContent =
        selectedDemands.size;
}

function renderHome() {
    const list = $("homeList");

    const recent = database.demands
        .slice()
        .reverse()
        .slice(0, 5);

    if (!recent.length) {
        list.innerHTML = empty("No recent demands.");
        return;
    }

    list.innerHTML = recent.map(item => `
        <div class="card">
            <div class="card-main">
                <b>${escapeHTML(item.medicine)}</b>
                <small>
                    Qty: ${item.quantity}
                    · By: ${escapeHTML(item.employee)}
                    <br>
                    ${new Date(item.createdAt).toLocaleString()}
                </small>
            </div>
            ${badge(item.status)}
        </div>
    `).join("");
}

function renderDemands() {
    const list = $("demandList");

    if (!database.demands.length) {
        list.innerHTML =
            empty("No demands yet. Add your first demand.");
        return;
    }

    list.innerHTML = database.demands.map(item => `
        <div class="card">

            ${
                item.status === "pending"
                ? `
                    <input
                        class="check demand-check"
                        type="checkbox"
                        data-id="${item.id}"
                        ${selectedDemands.has(item.id) ? "checked" : ""}
                    >
                `
                : ""
            }

            <div class="card-main">
                <b>${escapeHTML(item.medicine)}</b>

                <small>
                    Qty: ${item.quantity}
                    · By: ${escapeHTML(item.employee)}

                    ${
                        item.note
                        ? " · " + escapeHTML(item.note)
                        : ""
                    }

                    <br>
                    ${new Date(item.createdAt).toLocaleString()}
                </small>
            </div>

            ${badge(item.status)}

        </div>
    `).join("");

    document.querySelectorAll(".demand-check")
        .forEach(check => {
            check.addEventListener("change", function () {
                const id = Number(this.dataset.id);

                if (this.checked) {
                    selectedDemands.add(id);
                } else {
                    selectedDemands.delete(id);
                }

                $("selectedCount").textContent =
                    selectedDemands.size;
            });
        });
}

function renderOrders() {
    const list = $("orderList");

    if (!database.orders.length) {
        list.innerHTML = empty("No orders yet.");
        return;
    }

    list.innerHTML = database.orders
        .slice()
        .reverse()
        .map(order => `
            <div class="card">
                <div class="card-main">
                    <b>
                        ${escapeHTML(
                            order.distributor || "Unassigned"
                        )}
                    </b>

                    <small>
                        ${order.items.length} item(s)
                        ·
                        ${new Date(
                            order.createdAt
                        ).toLocaleString()}
                    </small>
                </div>

                ${
                    order.status === "received"
                    ? badge("received")
                    : `
                        <button
                            class="small-btn receive-btn"
                            data-id="${order.id}"
                        >
                            Mark Received
                        </button>
                    `
                }
            </div>
        `)
        .join("");

    document.querySelectorAll(".receive-btn")
        .forEach(button => {
            button.addEventListener("click", function () {
                markReceived(Number(this.dataset.id));
            });
        });
}

function showPage(pageName) {
    document.querySelectorAll(".page")
        .forEach(page => {
            page.classList.toggle(
                "active",
                page.id === pageName
            );
        });

    document.querySelectorAll(".nav")
        .forEach(nav => {
            nav.classList.toggle(
                "active",
                nav.dataset.page === pageName
            );
        });

    render();
}

function openDemandModal() {
    $("demandModal").classList.add("open");
    $("employee").focus();
}

function closeDemandModal() {
    $("demandModal").classList.remove("open");
}

function saveDemand(event) {
    event.preventDefault();

    const employee = $("employee").value.trim();
    const medicine = $("medicine").value.trim();
    const quantity = Number($("quantity").value);
    const note = $("note").value.trim();

    if (!employee) {
        alert("Please enter employee name.");
        return;
    }

    if (!medicine) {
        alert("Please enter medicine or product name.");
        return;
    }

    if (!quantity || quantity < 1) {
        alert("Quantity must be at least 1.");
        return;
    }

    database.demands.push({
        id: Date.now(),
        employee: employee,
        medicine: medicine,
        quantity: quantity,
        note: note,
        status: "pending",
        createdAt: new Date().toISOString()
    });

    save();

    event.target.reset();
    $("quantity").value = 1;

    closeDemandModal();
    render();
}

function createOrderMessage(items, distributor) {
    let message =
        "FAYSAL PHARMACY\n" +
        "PURCHASE ORDER\n";

    if (distributor) {
        message +=
            "Distributor: " +
            distributor +
            "\n";
    }

    message +=
        "Date: " +
        new Date().toLocaleDateString() +
        "\n\n";

    items.forEach((item, index) => {
        message +=
            (index + 1) +
            ". " +
            item.medicine +
            " — Qty: " +
            item.quantity;

        if (item.note) {
            message +=
                " — " +
                item.note;
        }

        message += "\n";
    });

    message +=
        "\nTotal items: " +
        items.length;

    return message;
}

function openOrderModal() {
    if (!selectedDemands.size) {
        alert("Select at least one pending demand.");
        return;
    }

    currentOrderItems =
        database.demands.filter(
            item => selectedDemands.has(item.id)
        );

    $("distributor").value = "";

    $("orderPreview").textContent =
        createOrderMessage(
            currentOrderItems,
            ""
        );

    $("orderModal").classList.add("open");
}

function closeOrderModal() {
    $("orderModal").classList.remove("open");
}

function updateOrderPreview() {
    $("orderPreview").textContent =
        createOrderMessage(
            currentOrderItems,
            $("distributor").value.trim()
        );
}

function sendWhatsApp() {
    const message =
        createOrderMessage(
            currentOrderItems,
            $("distributor").value.trim()
        );

    window.open(
        "https://wa.me/?text=" +
        encodeURIComponent(message),
        "_blank"
    );
}

function saveOrder() {
    if (!currentOrderItems.length) {
        return;
    }

    const distributor =
        $("distributor").value.trim();

    database.orders.push({
        id: Date.now(),
        distributor: distributor,
        items: currentOrderItems.map(item => ({ ...item })),
        status: "ordered",
        createdAt: new Date().toISOString()
    });

    const ids = new Set(
        currentOrderItems.map(item => item.id)
    );

    database.demands.forEach(item => {
        if (ids.has(item.id)) {
            item.status = "ordered";
        }
    });

    selectedDemands.clear();
    currentOrderItems = [];

    save();
    closeOrderModal();
    showPage("orders");
}

function markReceived(orderId) {
    const order = database.orders.find(
        item => item.id === orderId
    );

    if (!order) {
        return;
    }

    const ids = new Set(
        order.items.map(item => item.id)
    );

    database.demands.forEach(item => {
        if (ids.has(item.id)) {
            item.status = "received";
        }
    });

    order.status = "received";

    save();
    render();
}

function clearData() {
    if (!confirm("Clear all local demo data?")) {
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
