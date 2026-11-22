document.addEventListener("DOMContentLoaded", function () {
    initQueryParamAutoSelection();
    initAccessibleFormValidation();
});

// pre-select car from ?car= query parameter
function initQueryParamAutoSelection() {
    var carSelect = document.getElementById("car");
    if (!carSelect) return;

    var urlParams = new URLSearchParams(window.location.search);
    var selectedCar = urlParams.get("car");

    if (selectedCar) {
        var query = selectedCar.toLowerCase().trim();
        for (var i = 0; i < carSelect.options.length; i++) {
            var opt = carSelect.options[i];
            var val = opt.value.toLowerCase().trim();
            if (!val) continue; // skip blank placeholder so indexOf("") does not match 0
            if (val === query || val.indexOf(query) !== -1 || query.indexOf(val) !== -1) {
                carSelect.selectedIndex = i;
                opt.selected = true;
                break;
            }
        }
    }
}

function initAccessibleFormValidation() {
    var form = document.getElementById("enquiry-form");
    if (!form) return;

    var errorSummary = document.getElementById("error-summary");
    var errorList = document.getElementById("error-list");
    var successAlert = document.getElementById("submission-success");

    var fields = form.querySelectorAll("input, textarea, select");
    var phoneField = document.getElementById("phone");
    var phoneRequiredIndicator = document.getElementById("phone-required-indicator");
    var phoneHint = document.getElementById("phone-hint");
    var contactPhoneRadio = document.getElementById("contact-phone");
    var contactEmailRadio = document.getElementById("contact-email");

    function clearAllFeedback() {
        if (errorList) errorList.innerHTML = "";
        if (errorSummary) errorSummary.hidden = true;
        if (successAlert) successAlert.hidden = true;
        fields.forEach(clearFieldError);
    }

    // accepts either a DOM element or string id
    function clearSpecificFieldError(fieldOrId) {
        var field = typeof fieldOrId === "string" ? document.getElementById(fieldOrId) : fieldOrId;
        if (!field) return;
        clearFieldError(field);

        if (errorList) {
            var items = errorList.querySelectorAll("li");
            items.forEach(function (item) {
                var link = item.querySelector("a");
                if (link) {
                    var href = link.getAttribute("href") || link.href || "";
                    if (href === "#" + field.id || href.indexOf("#" + field.id) !== -1) {
                        item.remove();
                    }
                }
            });

            if (errorList.children.length === 0 && errorSummary) {
                errorSummary.hidden = true;
            }
        }
    }

    function updatePhoneRequirement() {
        if (!phoneField || !contactPhoneRadio) return;
        var isRequired = contactPhoneRadio.checked;
        phoneField.required = isRequired;
        phoneField.setAttribute("aria-required", isRequired ? "true" : "false");

        if (phoneRequiredIndicator) {
            phoneRequiredIndicator.style.display = isRequired ? "inline" : "none";
        }

        if (phoneHint) {
            phoneHint.textContent = isRequired
                ? "Required: enter your telephone number so our team can call you."
                : "Required if you select phone as your preferred contact method.";
        }

        if (!isRequired && (!phoneField.value || !phoneField.value.trim())) {
            clearSpecificFieldError(phoneField);
        }
    }

    updatePhoneRequirement();

    // clear only the error for the input currently being typed in
    fields.forEach(function (field) {
        field.addEventListener("input", function () {
            if (successAlert) successAlert.hidden = true;
            clearSpecificFieldError(field);
        });
    });

    if (contactPhoneRadio) {
        contactPhoneRadio.addEventListener("change", updatePhoneRequirement);
    }
    if (contactEmailRadio) {
        contactEmailRadio.addEventListener("change", updatePhoneRequirement);
    }

    form.addEventListener("reset", function () {
        clearAllFeedback();
        setTimeout(function () {
            updatePhoneRequirement();
        }, 10);
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault(); // stop native POST on local offline pages
        clearAllFeedback();
        var errors = [];

        var nameField = document.getElementById("full-name");
        if (nameField && !nameField.value.trim()) {
            errors.push({
                field: nameField,
                message: "Enter your full name."
            });
        }

        var emailField = document.getElementById("email");
        var emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
        if (emailField) {
            var emailVal = emailField.value.trim();
            if (!emailVal) {
                errors.push({
                    field: emailField,
                    message: "Enter your email address."
                });
            } else if (!emailRegex.test(emailVal)) {
                errors.push({
                    field: emailField,
                    message: "Enter a valid email address (e.g. name@example.co.uk)."
                });
            }
        }

        if (phoneField) {
            var phone = phoneField.value.trim();
            if (contactPhoneRadio && contactPhoneRadio.checked && !phone) {
                errors.push({
                    field: phoneField,
                    message: "Enter your telephone number for phone contact."
                });
            } else if (phone && (!/^\+?[\d\s().-]+$/.test(phone) || !/^\d{7,15}$/.test(phone.replace(/\D/g, "")))) {
                errors.push({
                    field: phoneField,
                    message: "Enter a telephone number with 7 to 15 digits, including the area code."
                });
            }
        }

        var messageField = document.getElementById("message");
        if (messageField) {
            var msgVal = messageField.value.trim();
            if (!msgVal) {
                errors.push({
                    field: messageField,
                    message: "Enter your enquiry message."
                });
            } else if (msgVal.length < 10) {
                errors.push({
                    field: messageField,
                    message: "Enter your enquiry message (minimum 10 characters)."
                });
            }
        }

        if (errors.length > 0) {
            errors.forEach(function (err) {
                applyFieldError(err.field, err.message);

                if (errorList) {
                    var li = document.createElement("li");
                    var link = document.createElement("a");
                    link.setAttribute("href", "#" + err.field.id);
                    link.href = "#" + err.field.id;
                    link.textContent = err.message;
                    link.addEventListener("click", function (e) {
                        e.preventDefault();
                        err.field.focus();
                    });
                    li.appendChild(link);
                    errorList.appendChild(li);
                }
            });

            if (errorSummary) {
                errorSummary.hidden = false;
                errorSummary.focus();
            }
            return;
        }

        if (successAlert) {
            var vehicleSelect = document.getElementById("car");
            var chosenVehicle = (vehicleSelect && vehicleSelect.value) ? vehicleSelect.value : "general enquiry";
            var feedbackText = document.getElementById("success-feedback-text");
            if (feedbackText && nameField) {
                feedbackText.textContent = "Thank you, " + nameField.value.trim() + 
                    "! Your sample enquiry for '" + chosenVehicle + "' passed the checks on this device.";
            }

            form.style.display = "none";
            successAlert.hidden = false;
            successAlert.focus();
        }
    });

    var resetBtn = document.getElementById("btn-reset-form");
    if (resetBtn) {
        resetBtn.addEventListener("click", function() {
            form.reset();
            form.style.display = "";
            if (successAlert) successAlert.hidden = true;
            clearAllFeedback();
            if (nameField) nameField.focus();
        });
    }

    form.noValidate = true;
}

function applyFieldError(field, message) {
    if (!field) return;
    field.classList.add("input-error");
    field.setAttribute("aria-invalid", "true");

    var errorId = field.id.replace("full-", "") + "-error";
    var errorSpan = document.getElementById(errorId);
    if (errorSpan) {
        errorSpan.textContent = message;
    }
}

function clearFieldError(field) {
    if (!field) return;
    field.classList.remove("input-error");
    field.removeAttribute("aria-invalid");

    var errorId = field.id.replace("full-", "") + "-error";
    var errorSpan = document.getElementById(errorId);
    if (errorSpan) {
        errorSpan.textContent = "";
    }
}
