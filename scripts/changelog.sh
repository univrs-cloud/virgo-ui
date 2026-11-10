#!/bin/bash

set -o errexit -o pipefail

package=$(jq -r '.name' package.json)
maintainer='univrs <voyager@univrs.cloud>'
extra_dir='deb-extra'
doc_dir="$extra_dir/usr/share/doc/$package"
version_pattern='^v?[0-9]+\.[0-9]+\.[0-9]+$'
prefix_pattern='^([a-z]+)(\([^)]*\))?!?: (.*)$'

print_section() {
	local heading="$1"
	local lines="$2"
	if [ -z "$lines" ]; then
		return
	fi

	printf '  %s\n%s\n' "$heading" "$lines"
}

print_entry() {
	local tag="$1"
	local previous_tag="$2"
	local features='' fixes='' other='' subject type message

	while IFS= read -r subject; do
		if [[ "$subject" =~ $version_pattern ]]; then
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
			feat) features+="  * $message"$'\n' ;;
			fix) fixes+="  * $message"$'\n' ;;
			*) other+="  * $message"$'\n' ;;
		esac
	done < <(git log --no-merges --reverse --format=%s "$previous_tag..$tag")

	printf '%s (%s) stable; urgency=low\n\n' "$package" "${tag#v}"
	print_section 'Features' "$features"
	print_section 'Fixes' "$fixes"
	print_section 'Other' "$other"
	printf ' -- %s  %s\n\n' "$maintainer" "$(git log -1 --format=%aD "$tag")"
}

rm -rf "$extra_dir"
mkdir -p "$doc_dir"

tag=''
while IFS= read -r previous_tag; do
	if [ -n "$tag" ]; then
		print_entry "$tag" "$previous_tag"
	fi
	tag="$previous_tag"
done < <(git tag --merged HEAD --list 'v*' --sort=-v:refname) | gzip -9n > "$doc_dir/changelog.gz"
