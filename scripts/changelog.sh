#!/bin/bash

set -o errexit -o pipefail

package=$(jq -r '.name' package.json)
maintainer='univrs <voyager@univrs.cloud>'
extra_dir='deb-extra'
doc_dir="$extra_dir/usr/share/doc/$package"
release_notes='release-notes.md'
version_pattern='^v?[0-9]+\.[0-9]+\.[0-9]+$'
prefix_pattern='^([a-z]+)(\([^)]*\))?!?: (.*)$'

print_section() {
	local heading="$1"
	local item_prefix="$2"
	local lines="$3"
	if [ -z "$lines" ]; then
		return
	fi

	printf '%s\n' "$heading"
	printf '%s' "$lines" | sed "s/^/$item_prefix/"
	printf '\n'
}

print_debian_entry() {
	printf '%s (%s) stable; urgency=low\n\n' "$package" "$version"
	print_section '  Features' '  * ' "$features"
	print_section '  Fixes' '  * ' "$fixes"
	print_section '  Other' '  * ' "$other"
	printf ' -- %s  %s\n\n' "$maintainer" "$version_date"
}

print_markdown_entry() {
	print_section '### Features' '- ' "$features"
	print_section '### Fixes' '- ' "$fixes"
	print_section '### Other' '- ' "$other"
}

rm -rf "$extra_dir"
mkdir -p "$doc_dir"
: > "$release_notes"

version=''
version_date=''
features=''
fixes=''
other=''
newest=true
while IFS=$'\x1f' read -r subject date; do
	if [[ "$subject" =~ $version_pattern ]]; then
		if [ -n "$version" ]; then
			if [ "$newest" = true ]; then
				print_markdown_entry > "$release_notes"
				newest=false
			fi
			print_debian_entry
		fi
		version="${subject#v}"
		version_date="$date"
		features=''
		fixes=''
		other=''
		continue
	fi

	if [ -z "$version" ]; then
		continue
	fi

	if [[ "$subject" =~ $prefix_pattern ]]; then
		type="${BASH_REMATCH[1]}"
		message="${BASH_REMATCH[3]}"
	else
		type=''
		message="$subject"
	fi

	case "$type" in
		feat) features="$message"$'\n'"$features" ;;
		fix) fixes="$message"$'\n'"$fixes" ;;
		*) other="$message"$'\n'"$other" ;;
	esac
done < <(git log --no-merges --format='%s%x1f%aD') | gzip -9n > "$doc_dir/changelog.gz"
