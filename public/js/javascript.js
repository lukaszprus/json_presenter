function JSONPresenter(data, tableHeadID, tableBodyID, options) {
    'use strict';
    var tdCreatorOverrides = options && options.tdCreatorOverrides,
        filters = options && options.filters,
        filteredData = _.clone(data), // Shallow copy will do!
        keys = Object.keys(data[0]),
        kl = keys.length,
        tableHeadEl = document.getElementById(tableHeadID),
        tableBodyEl = document.getElementById(tableBodyID),
        $ = jQuery;

    function renderHead() {
        console.log('Inside renderHead');
        var doc = document.createDocumentFragment(),
            th, tr, txt, j;
        tableHeadEl.innerHTML = '';
        tr = document.createElement('tr');
        for (j = 0; j < kl; j += 1) {
            txt = document.createTextNode(keys[j]);
            th = document.createElement('th');
            th.appendChild(txt);
            tr.appendChild(th);
        }
        doc.appendChild(tr);
        tableHeadEl.appendChild(doc);
    }

    function render() {
        console.log('Inside render');
        var fdl = filteredData.length,
            doc = document.createDocumentFragment(),
            el, td, tr, row, key, i, j;
        if (fdl === 0) {
            tableBodyEl.innerHTML = '';
            return;
        }
        tableBodyEl.innerHTML = '';
        for (i = 0; i < fdl; i += 1) {
            row = filteredData[i];
            tr = document.createElement('tr');
            for (j = 0; j < kl; j += 1) {
                key = keys[j];
                if (tdCreatorOverrides && tdCreatorOverrides[key]) {
                    el = tdCreatorOverrides[key](row[key]);
                } else {
                    el = document.createTextNode(row[key]);
                }
                td = document.createElement('td');
                td.appendChild(el);
                tr.appendChild(td);
            }
            doc.appendChild(tr);
        }
        tableBodyEl.appendChild(doc);
    }

    function sort(key, order) {
        filteredData = _.sortBy(filteredData, key);
        if (order === 'desc') {
            filteredData.reverse();
        }
    }

    function addSorters() {
        if (options && options.sorters === true) {
            $(tableHeadEl).on('click', 'th', function () {
                var $this = $(this);
                if ($this.hasClass('sort_asc')) {
                    sort(this.innerHTML, 'desc');
                    render();
                    $this.toggleClass('sort_asc sort_desc');
                } else if ($this.hasClass('sort_desc')) {
                    sort(this.innerHTML);
                    render();
                    $this.toggleClass('sort_asc sort_desc');
                } else {
                    $(tableHeadEl).find('th').removeClass('sort_asc sort_desc');
                    sort(this.innerHTML);
                    render();
                    $this.addClass('sort_asc');
                }
            });
        }
    }

    function uiFiltersChanged() {
        console.log('Inside uiFiltersChanged');
        applyFilters();
        applyUISort();
        render();
    }

    function applyUISort() {
        if (options && options.sorters === true) {
            console.log('Inside applyUISort');
            var uiSort = $(tableHeadEl).find('th.sort_asc, th.sort_desc'),
                key;
            if (uiSort.length > 0) {
                key = $(uiSort[0]).text();
                sort(key, $(uiSort[0]).hasClass('sort_desc') ? 'desc' : undefined);
            }
        }
    }

    function filterFunction(obj) {
        var key, filtersKey, objKey;
        for (key in filters) {
            if (filters.hasOwnProperty(key)) {
                filtersKey = filters[key];
                objKey = obj[key];
                if (filtersKey.type === 'slider' && (objKey < filtersKey.uiValue[0] || objKey > filtersKey.uiValue[1])) {
                    return false;
                } else if (filtersKey.type === 'text-filter' && objKey.toLowerCase().indexOf(filtersKey.uiValue.toLowerCase()) === -1) {
                    return false;
                }
            }
        }
        return true;
    }

    function applyFilters() {
        console.log('Inside applyFilters');
        var dataClone = _.clone(data);
        readFilters();
        filteredData = _.filter(dataClone, filterFunction);
    }

    function readFilters() {
        console.log('Inside readFilters');
        var key, $el;
        for (key in filters) {
            if (filters.hasOwnProperty(key)) {
                $el = $(filters[key].el);
                if (filters[key].type === 'slider') {
                    filters[key].uiValue = [$el.slider('values', 0), $el.slider('values', 1)];
                } else if (filters[key].type === 'text-filter') {
                    filters[key].uiValue = $el.val();
                }
            }
        }
    }

    function addFilters() {
        if (options && options.filters) {
            // Calculate lower and upper boundaries for sliders one-off
            (function () {
                var key;
                for (key in filters) {
                    if (filters.hasOwnProperty(key) && filters[key].type === 'slider') {
                        filters[key].boundaries = {
                            lower: Math.floor(_.min(data, function (obj) {
                                return obj[key];
                            })[key]),
                            upper: Math.floor(_.max(data, function (obj) {
                                return obj[key];
                            })[key])
                        };
                    }
                }
            })();
            // Create sliders one-off
            (function () {
                var key, lowerBoundary, upperBoundary, el;
                for (key in filters) {
                    if (filters.hasOwnProperty(key) && filters[key].type === 'slider') {
                        lowerBoundary = filters[key].boundaries.lower;
                        upperBoundary = filters[key].boundaries.upper;
                        el = filters[key].el;
                        $(el).slider({
                            range: true,
                            min: lowerBoundary,
                            max: upperBoundary,
                            values: [lowerBoundary, upperBoundary],
                            change: (function (el) {
                                return function (event, ui) {
                                    $(el + '-range').text(ui.values[0] + ' - ' + ui.values[1]);
                                    uiFiltersChanged();
                                };
                            })(el)
                        });
                    }
                }
            })();
            // Add text filter submission handler one-off
            (function () {
                var textFilterUIElements = $(_.pluck(_.where(filters, {
                    type: 'text-filter'
                }), 'el').toString()).get(),
                    i, l;
                for (i = 0, l = textFilterUIElements.length; i < l; i += 1) {
                    $(textFilterUIElements[i].form).submit(function (e) {
                        e.preventDefault();
                        uiFiltersChanged();
                    });
                }
            })();
            // Add reset handler
            $(options.resetEl).on('click', function () {
                var key, $el, min, max;
                for (key in filters) {
                    if (filters.hasOwnProperty(key)) {
                        $el = $(filters[key].el);
                        if (filters[key].type === 'slider') {
                            min = $el.slider('option', 'min');
                            max = $el.slider('option', 'max');
                            $el.slider('values', [min, max]);
                        } else if (filters[key].type === 'text-filter') {
                            $el.val('');
                        }
                    }
                }
                filteredData = _.clone(data);
                applyUISort();
                render();
            });
        }
    }
    renderHead();
    render();
    addSorters();
    addFilters();
    /*         JSON_DATA_TABLE = {
            getData: function () {
                return data;
            },
            getFilteredData: function () {
                return filteredData;
            },
            renderHead: renderHead,
            render: render,
            sort: sort,
            addSorters: addSorters
        }; */
}
jQuery(function ($) {
    'use strict';
    var hotelsFilters = {
        MinCost: {
            el: '#slider-min-cost',
            type: 'slider'
        },
        TrpRating: {
            el: '#slider-trp-rating',
            type: 'slider'
        },
        UserRating: {
            el: '#slider-user-rating',
            type: 'slider'
        },
        Stars: {
            el: '#slider-stars',
            type: 'slider'
        },
        Name: {
            el: '#text-filter-name',
            type: 'text-filter'
        },
        Location: {
            el: '#text-filter-location',
            type: 'text-filter'
        }
    },
        dataFilters = {
            income: {
                el: '#slider-data-income',
                type: 'slider'
            }
        },
        options = {
            tdCreatorOverrides: {
                ImageUrl: function (value) {
                    var att = document.createAttribute('src'),
                        el = document.createElement('img');
                    att.value = value;
                    el.setAttributeNode(att);
                    return el;
                }
            },
            filters: hotelsFilters,
            sorters: true,
            resetEl: '#reset-filters'
        };
    $.get('hotels.min.json', undefined, function (data) {
        var hotelsTable = new JSONPresenter(data.Establishments, 'table-head1', 'table-body1', options);
    }, 'json');
    $.get('dataNov-14-2013.json', undefined, function (data) {
        var dataTable = new JSONPresenter(data, 'table-head2', 'table-body2', {
            filters: dataFilters,
            sorters: true
        });
    }, 'json');
});
