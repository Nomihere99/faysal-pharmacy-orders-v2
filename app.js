const KEY = "faysalOrdersV2";

let db = JSON.parse(
    localStorage.getItem(KEY) ||
    '{"demands":[],"orders":[]}'
);

let selected = new Set();
let pendingOrder = [];

const $ = id => document.getElementById(id);

function save() {
    localStorage.setItem(KEY, JSON.stringify(db));
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[m]));
}

function badge(status) {
    return `
        <span class="badge ${status}">
            ${status[0].toUpperCase() + status.slice(1)}
        </span>
    `;
}

function empty(text) {
    return `
        <div class="info-card">
            <p>${text}</p>
        </div>
    `;
}

function render() {

    const pending =
        db.demands.filter(x => x.status === "pending").length;

    $("pendingStat").textContent = pending;

    $("orderedStat").textContent =
        db.demands.filter(x => x.status === "ordered").length;

    $("receivedStat").textContent =
        db.demands.filter(x => x.status === "received").length;


    let html = db.demands.map(d => `

        <div class="card">

            ${
                d.status === "pending"
                ? `
                    <input
                        class="check demand-check"
                        type="checkbox"
                        data-id="${d.id}"
                        ${selected.has(d.id) ? "checked" : ""}
                    >
                `
                : ""
            }

            <div class="card-main">

                <b>${esc(d.medicine)}</b>

                <small>
                    Qty: ${d.quantity}
                    ${d.note ? " · " + esc(d.note) : ""}
                </small>

            </div>

            ${badge(d.status)}

        </div>

    `).join("");


    $("demandList").innerHTML =
        html || empty("No demands yet. Add your first demand.");


    $("homeList").innerHTML =
        db.demands
            .slice(0, 5)
            .map(d => `

                <div class="card">

                    <div class="card-main">

                        <b>${esc(d.medicine)}</b>

                        <small>
                            Qty: ${d.quantity}
                            · ${new Date(d.createdAt).toLocaleString()}
                        </small>

                    </div>

                    ${badge(d.status)}

                </div>

            `)
            .join("")
        || empty("No recent demands.");


    $("selectedCount").textContent =
        selected.size;


    $("orderList").innerHTML =
        db.orders
            .slice()
            .reverse()
            .map(o => `

                <div class="card">

                    <div class="card-main">

                        <b>
                            ${esc(
                                o.distributor ||
                                "Unassigned"
                            )}
                        </b>

                        <small>
                            ${o.items.length} items
                            ·
                            ${new Date(
                                o.createdAt
                            ).toLocaleString()}
                        </small>

                    </div>

                </div>

            `)
            .join("")
        || empty("No orders yet.");


    document
        .querySelectorAll(".demand-check")
        .forEach(c => {

            c.onchange = () => {

                const id =
                    Number(c.dataset.id);

                if (c.checked) {
                    selected.add(id);
                } else {
                    selected.delete(id);
                }

                $("selectedCount").textContent =
                    selected.size;
            };

        });

}


function page(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(x =>
            x.classList.toggle(
                "active",
                x.id === pageName
            )
        );


    document
        .querySelectorAll(".nav")
        .forEach(x =>
            x.classList.toggle(
                "active",
                x.dataset.page === pageName
            )
        );


    render();

}


/* ADD DEMAND */

$("addDemandBtn").onclick = () => {

    $("demandModal").classList.add("open");

    $("medicine").focus();

};


$("closeModal").onclick = () => {

    $("demandModal").classList.remove("open");

};


$("demandModal")
    .querySelector(".backdrop")
    .onclick = () => {

        $("demandModal").classList.remove("open");

    };


/* QUANTITY */

$("plus").onclick = () => {

    $("quantity").value =
        Number($("quantity").value || 1) + 1;

};


$("minus").onclick = () => {

    $("quantity").value =
        Math.max(
            1,
            Number($("quantity").value || 1) - 1
        );

};


/* SAVE DEMAND */

$("demandForm").onsubmit = event => {

    event.preventDefault();


    db.demands.push({

        id: Date.now(),

        medicine:
            $("medicine").value.trim(),

        quantity:
            Number($("quantity").value),

        note:
            $("note").value.trim(),

        status:
            "pending",

        createdAt:
            new Date().toISOString()

    });


    save();


    event.target.reset();

    $("quantity").value = 1;

    $("demandModal").classList.remove("open");

    render();

};


/* WHATSAPP MESSAGE */

function message(items, distributor) {

    let text =
        `FAYSAL PHARMACY\n` +
        `PURCHASE ORDER\n`;

    if (distributor) {

        text +=
            `Distributor: ${distributor}\n`;

    }

    text +=
        `Date: ${new Date().toLocaleDateString()}\n\n`;


    items.forEach((item, index) => {

        text +=
            `${index + 1}. ` +
            `${item.medicine} — ` +
            `Qty: ${item.quantity}`;

        if (item.note) {

            text +=
                ` — ${item.note}`;

        }

        text += "\n";

    });


    text +=
        `\nTotal items: ${items.length}`;


    return text;

}


/* CREATE ORDER */

$("makeOrderBtn").onclick = () => {

    if (!selected.size) {

        alert(
            "Select at least one pending demand."
        );

        return;

    }


    pendingOrder =
        db.demands.filter(
            demand =>
                selected.has(demand.id)
        );


    $("distributor").value = "";

    $("orderPreview").textContent =
        message(
            pendingOrder,
            ""
        );


    $("orderModal")
        .classList.add("open");

};


/* CLOSE ORDER */

$("closeOrder").onclick = () => {

    $("orderModal")
        .classList.remove("open");

};


$("orderModal")
    .querySelector(".backdrop")
    .onclick = () => {

        $("orderModal")
            .classList.remove("open");

    };


/* LIVE ORDER PREVIEW */

$("distributor").oninput = () => {

    $("orderPreview").textContent =
        message(
            pendingOrder,
            $("distributor").value.trim()
        );

};


/* WHATSAPP */

$("whatsappBtn").onclick = () => {

    const text =
        message(
            pendingOrder,
            $("distributor").value.trim()
        );


    window.open(
        "https://wa.me/?text=" +
        encodeURIComponent(text),
        "_blank"
    );

};


/* SAVE ORDER */

$("saveOrderBtn").onclick = () => {

    if (!pendingOrder.length) {
        return;
    }


    db.orders.push({

        id: Date.now(),

        distributor:
            $("distributor").value.trim(),

        items:
            pendingOrder.map(
                item => ({ ...item })
            ),

        createdAt:
            new Date().toISOString()

    });


    const ids =
        new Set(
            pendingOrder.map(
                item => item.id
            )
        );


    db.demands.forEach(item => {

        if (ids.has(item.id)) {

            item.status = "ordered";

        }

    });


    selected.clear();

    pendingOrder = [];


    save();


    $("orderModal")
        .classList.remove("open");


    page("orders");

};


/* NAVIGATION */

document
    .querySelectorAll(".nav")
    .forEach(nav => {

        nav.onclick = () => {

            page(
                nav.dataset.page
            );

        };

    });


/* CLEAR DEMO DATA */

$("clearDataBtn").onclick = () => {

    if (
        confirm(
            "Clear all local demo data?"
        )
    ) {

        db = {
            demands: [],
            orders: []
        };

        selected.clear();

        save();

        render();

    }

};


/* START */

render();
