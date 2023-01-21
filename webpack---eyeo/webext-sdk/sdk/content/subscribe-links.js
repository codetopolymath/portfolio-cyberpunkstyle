/*
 * This file is part of eyeo's Web Extension Ad Blocking Toolkit (EWE),
 * Copyright (C) 2006-present eyeo GmbH
 *
 * EWE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * EWE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EWE.  If not, see <http://www.gnu.org/licenses/>.
 */

import browser from "webextension-polyfill";
import {
    ignoreNoConnectionError
} from "../errors.js";

export function handleSubscribeLinks() {
    document.addEventListener("click", event => {
        if (event.button == 2 || !event.isTrusted)
            return;

        let link = event.target;
        while (!(link instanceof HTMLAnchorElement)) {
            link = link.parentNode;

            if (!link)
                return;
        }

        let queryString = null;
        if (link.protocol == "http:" || link.protocol == "https:") {
            if (link.host == "subscribe.adblockplus.org" && link.pathname == "/")
                queryString = link.search.substr(1);
        } else {
            // Firefox doesn't seem to populate the "search" property for
            // links with non-standard URL schemes so we need to extract the query
            // string manually.
            let match = /^abp:\/*subscribe\/*\?(.*)/i.exec(link.href);
            if (match)
                queryString = match[1];
        }

        if (!queryString)
            return;

        let title = null;
        let url = null;
        for (let param of queryString.split("&")) {
            let parts = param.split("=", 2);
            if (parts.length != 2 || !/\S/.test(parts[1]))
                continue;
            switch (parts[0]) {
                case "title":
                    title = decodeURIComponent(parts[1]);
                    break;
                case "location":
                    url = decodeURIComponent(parts[1]);
                    break;
            }
        }
        if (!url)
            return;

        if (!title)
            title = url;

        title = title.trim();
        url = url.trim();
        if (!/^(https?|ftp):/.test(url))
            return;

        ignoreNoConnectionError(
            browser.runtime.sendMessage({
                type: "ewe:subscribe-link-clicked",
                title,
                url
            })
        );

        event.preventDefault();
        event.stopPropagation();
    }, true);
}