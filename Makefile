FILES = \
	install.rdf \
	chrome.manifest \
	chrome/content/gfire.png \
	chrome/content/gfirewebdetection.js \
	chrome/content/gfirewebdetection-firefox.xul \
	chrome/content/gfirewebdetection-seamonkey.xul \
	chrome/locale/de/gfirewebdetection.dtd \
	chrome/locale/de/gfirewebdetection.properties \
	chrome/locale/en/gfirewebdetection.dtd \
	chrome/locale/en/gfirewebdetection.properties \
	chrome/locale/fr/gfirewebdetection.dtd \
	chrome/locale/fr/gfirewebdetection.properties \
	chrome/locale/sk/gfirewebdetection.dtd \
	chrome/locale/sk/gfirewebdetection.properties \
	chrome/locale/sv/gfirewebdetection.dtd \
	chrome/locale/sv/gfirewebdetection.properties \
	chrome/skin/images/gfire_active.png \
	chrome/skin/images/gfire_inactive.png \
	defaults/preferences/gfirewebdetection.js

all: firefox-ext

firefox-ext: chrome.manifest
	zip gfirewebdetection.xpi $(FILES)

clean:
	rm -f gfirewebdetection.xpi
